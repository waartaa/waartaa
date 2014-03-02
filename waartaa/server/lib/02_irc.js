Meteor.startup(function () {
    WHO_DATA_POLL_LOCK = {};
});

if (typeof(logger) == 'undefined')
    logger = Winston;

GLOBAL_LISTENERS = {};
RECENT_CHANNEL_LOGS = {};
CHANNEL_LOGS_WRITE_LOCKS = {};


ChannelListenersManager = function () {
    var _CHANNEL_CLIENTS = {};
    var _CHANNEL_LISTENERS = {};
    var _MAX_LISTENERS_PER_CHANNEL = 4;

    function _updateChannelListeners (server_name, channel_name) {
        var key = server_name + channel_name;
        var channel_clients = _CHANNEL_CLIENTS[key] || {};
        if (_CHANNEL_LISTENERS[key] === undefined)
            _CHANNEL_LISTENERS[key] = {};
        var channel_listeners = _CHANNEL_LISTENERS[key] || {};

        console.log("=====BEFORE======");
        console.log(_CHANNEL_CLIENTS, _CHANNEL_LISTENERS);
        for (nick in channel_listeners) {
            if (channel_clients[nick] === undefined) {
                delete channel_listeners[nick];
            }
        }
        var listeners_count = Object.keys(channel_clients).length;
        for (nick in channel_clients) {
            if (listeners_count < _MAX_LISTENERS_PER_CHANNEL) {
                if (channel_listeners[nick] === undefined) {
                    channel_listeners[nick] = channel_clients[nick];
                    listeners_count++;
                }
            } else
                break;
        }
        console.log("=====AFTER======");
        console.log(_CHANNEL_CLIENTS, _CHANNEL_LISTENERS);

    }

    return {
        addChannelClient: function (server_name, channel_name, nick, username) {
            var key = server_name + channel_name;
            if (_CHANNEL_CLIENTS[key] === undefined)
                _CHANNEL_CLIENTS[key] = {};
            if (_CHANNEL_CLIENTS[key][nick] === undefined) {
                _CHANNEL_CLIENTS[key][nick] = username;
                enqueueTask(DELAYED_QUEUE, function () {
                    Fiber(function () {
                        try {
                            ChannelNicks.update(
                                {
                                    nick: nick, channel_name: channel_name,
                                    server_name: server_name
                                },
                                {$set: {}},
                                {upsert: true},
                                function (err, updated) {}
                            );
                        } catch (err) {
                            logger.info('ChannelNicksUpsertError', {error: err});
                        }
                    }).run();
                });
                _updateChannelListeners(server_name, channel_name);
                return true;
            }
            return false;
        },
        removeChannelClient: function (server_name, channel_name, nick, username) {
            var key = server_name + channel_name;
            if (_CHANNEL_CLIENTS[key] === undefined)
                _CHANNEL_CLIENTS[key] = {};
            if (_CHANNEL_CLIENTS[key][nick] !== undefined) {
                delete _CHANNEL_CLIENTS[key][nick];
                enqueueTask(DELAYED_QUEUE, function () {
                    Fiber(function () {
                        ChannelNicks.remove(
                          {
                            channel_name: channel_name,
                            server_name: server_name,
                            nick: nick
                          },
                          function (err) {}
                        );
                    }).run();
                });
                _updateChannelListeners(server_name, channel_name);
                return true;
            }
            return false;
        },
        removeNickFromChannels: function (server_name, channel_names, nick) {
            _.each(channel_names, function (channel_name) {
                var key = server_name + channel_name;
                if (_CHANNEL_CLIENTS[key] === undefined)
                    _CHANNEL_CLIENTS[key] = {};
                if (_CHANNEL_CLIENTS[key][nick] !== undefined) {
                    delete _CHANNEL_CLIENTS[key][nick];
                    _updateChannelListeners(server_name, channel_name);
                }
            });
            enqueueTask(DELAYED_QUEUE, function () {
                Fiber(function () {
                    ChannelNicks.remove(
                        {nick: nick, channel_name: {$in: channel_names},
                        server_name: server_name}, function (err) {});
                }).run();
            });
        },
        isClientListener: function (server_name, channel_name, nick) {
            var key = server_name + channel_name;
            if ((_CHANNEL_LISTENERS[key] || {})[nick] === undefined) {
                console.log('========NICK NOT LISTENER========');
                console.log(server_name, channel_name, nick);
                console.log(_CHANNEL_LISTENERS);
                return false;
            }
            console.log('========NICK IS LISTENER========');
            console.log(server_name, channel_name, nick);
            console.log(_CHANNEL_LISTENERS);
            return true;
        }

    };
};
channel_listeners_manager = ChannelListenersManager();

function shallWriteChannelLog (nick, text, channel_name, server_name, client_nick) {
    console.log('++++++++++++++++++++++++++++++++');
    console.log(RECENT_CHANNEL_LOGS);
    if (RECENT_CHANNEL_LOGS[server_name] === undefined)
        RECENT_CHANNEL_LOGS[server_name] = {};
    if (RECENT_CHANNEL_LOGS[server_name][channel_name] === undefined)
        RECENT_CHANNEL_LOGS[server_name][channel_name] = new CappedArray(10);
    var recent_channel_logs = RECENT_CHANNEL_LOGS[server_name][channel_name];
    var latest_message = recent_channel_logs[recent_channel_logs.length - 1];
    var second_latest_message = recent_channel_logs[recent_channel_logs.length - 2];
    var current_message = {
        nick: nick, text: text, client_nick: client_nick
    };
    console.log('current_message', current_message);
    console.log('latest_message', latest_message);
    console.log('second_latest_message', second_latest_message);
    var shall_wrtite = false;
    if (latest_message) {
        if (latest_message.client_nick == current_message.client_nick)
            shall_wrtite = true;
        else if (latest_message.nick != current_message.nick ||
                latest_message.text != current_message.text) {
            console.log('second_latest_message', second_latest_message);
            if (second_latest_message) {
                if (second_latest_message.text != current_message.text) {
                    shall_wrtite = true;
                }
            } else {
                shall_wrtite = true;
            }
        }
    } else {
        shall_wrtite = true;
    }
    console.log('shall_wrtite', shall_wrtite);
    if (shall_wrtite) {
        console.log('recent_channel_logs', recent_channel_logs);
        recent_channel_logs.push(current_message);
        console.log('recent_channel_logs', recent_channel_logs);
        console.log(RECENT_CHANNEL_LOGS[server_name][channel_name]);
        console.log('recent_channel_logs', recent_channel_logs);
    }
    return shall_wrtite;
}

IRCHandler = function (user, user_server) {
    var client_data = {};
    var client = null;
    var user_status = "";
    var channels_listening_to = {};
    var LISTENERS = {
        server: {},
        channel: {}
    };
    var JOBS = {};

    /* Event listener callbacks */
    /* Callbacks */
    function getOrCreateUserChannel(channel_data) {
        var channel = UserChannels.findOne({
            user_server_id: user_server._id, name: channel_data.name,
            user: user.username
        });
        if (!channel) {
            var user_channel_id = UserChannels.insert({
                name: channel_data.name,
                user_server_id: user_server._id,
                user_server_name: user_server.name,
                user: user.username,
                user_id: user._id,
                creator: user.username,
                creator_id: user._id,
                created: new Date(),
                last_updater: user.username,
                last_updater_id: user._id,
                last_updated: new Date(),
                active: true
            });
            var channel = UserChannels.findOne({_id: user_channel_id});
        }
        return channel;
    }

    function _joinChannelCallback (message, channel) {
        channel_listeners_manager.addChannelClient(
            user_server.name, channel.name, client.nick, user.username);
        if (channel.status == 'connected')
            return;
        Fiber(function () {
            UserChannels.update(
                {_id: channel._id}, {$set: {status: 'connected'}});
        }).run();
        if (LISTENERS.channel['message' + channel.name] != undefined)
            return;
        LISTENERS.channel['message', channel.name] = '';
        // Remove channel message listeners if any
        var listeners = client.listeners('message' + channel.name);
        _.each(listeners, function (listener) {
            client.removeListener('message' + channel.name, listener);
        });
        client.addListener('message' + channel.name, function (
                nick, text, message) {
            enqueueTask(URGENT_QUEUE, function () {
                Fiber(function () {
                    var global = false;
                    if (message.type != 'NOTICE')
                        global = true;
                    var not_for_user = null;

                    function insertChannelLog () {
                        ChannelLogs.insert({
                            message: text,
                            raw_message: message,
                            from: nick,
                            from_user: null,
                            from_user_id: null,
                            channel_name: channel.name,
                            channel_id: channel._id,
                            server_name: user_server.name,
                            server_id: user_server._id,
                            user: user.username,
                            user_id: user._id,
                            global: global,
                            not_for_user: not_for_user,
                            created: new Date(),
                            last_updated: new Date()
                        }, function (err, id) {});
                    }
                    if (channel_listeners_manager.isClientListener(
                            user_server.name, channel.name, client.nick)) {
                        if (typeof(CHANNEL_LOGS_WRITE_LOCKS[user_server.name]) == 'undefined')
                            CHANNEL_LOGS_WRITE_LOCKS[user_server.name] = {};
                        if (typeof(CHANNEL_LOGS_WRITE_LOCKS[user_server.name][channel.name]) == 'undefined')
                            CHANNEL_LOGS_WRITE_LOCKS[user_server.name][channel.name] = new locks.createReadWriteLock();
                        var rwlock = CHANNEL_LOGS_WRITE_LOCKS[user_server.name][channel.name];
                        rwlock.timedWriteLock(5000, function (error) {
                            Fiber(function () {
                                if (error) {
                                    console.log('Could not get the lock within 5 seconds, so gave up');
                                } else {
                                    console.log('Acquired write lock', user_server.name, channel.name);
                                    var shall_write = shallWriteChannelLog(nick, text, channel.name, user_server.name, client.nick);
                                    rwlock.unlock();
                                    not_for_user = (UserServers.findOne({name: user_server.name, current_nick: nick}) || {}).user || null;
                                    if (shall_write)
                                        insertChannelLog();
                                }
                            }).run();
                        });
                    } else if (global == false) {
                        insertChannelLog();
                    }
                }).run();
            });
            enqueueTask(DELAYED_QUEUE, function () {
                Fiber(function () {
                    if (_.isUndefined(Meteor.presences.findOne({userId: user._id}))) {
                        if (messageContainsNick(text, user_server.current_nick)
                                && nick) {
                            waartaa.notifications.notify_channel_mention(
                                user, channel, nick, text);
                        }
                    }
                }).run();
            });
        });
    }

    function _updateChannelNicks (channel_name, nicks) {
        var nicks_list = [];
        for (nick in nicks) {
            nicks_list.push(nick);
        }
        enqueueTask(DELAYED_QUEUE, function () {
            Fiber(function () {
                ChannelNicks.remove(
                    {
                        channel_name: channel_name, server_name: user_server.name,
                        nick: {$nin: nicks_list}
                    }
                );
            }).run();
        });
        _.each(nicks_list, function (nick) {
            enqueueTask(DELAYED_QUEUE, function () {
                Fiber(function () {
                    try {
                        ChannelNicks.update(
                            {channel_name: channel_name, server_name: user_server.name,
                             nick: nick},
                            {$set: {}},
                            {upsert: true},
                            function (err, updated) {}
                        );
                    } catch (err) {
                        logger.info(
                            "ChannelNicksUpsertError", {error: err});
                    }
                }).run();
            });
        });
        /*
        try {
            var db_nicks_count = ChannelNicks.find(
                {channel_name: channel_name, server_name: user_server.name}
            ).count();
            var irc_nicks_count = nicks_list.length;
            assert(db_nicks_count == irc_nicks_count);
        } catch (err) {
            console.log(err);
            if (err)
                logger.error(
                    'ChannelNicksUpdateError for ' + user_server.name +
                        channel_name,
                    {
                        'nicks_list': nicks_list,
                        'irc_nicks_count': irc_nicks_count,
                        'db_nicks_count': db_nicks_count,
                        'nicks_nin': ChannelNicks.find({
                            channel_name: channel_name, server_name: user_server.name,
                            nick: { $nin: nicks_list }
                        }, {'nick': 1}).fetch(),
                        'error': err
                    }
                );
        }*/
    }

    function _addChannelNamesListener (channel_name) {
        if (LISTENERS.channel['names' + channel_name] != undefined)
            return;
        LISTENERS.channel['names' + channel_name] = '';
        client.addListener('names' + channel_name, function (nicks) {
            if (!GLOBAL_LISTENERS['channelNamesListener-' + user_server + channel_name]) {
                GLOBAL_LISTENERS['channelNamesListener-' + user_server + channel_name] = true;
                _updateChannelNicks(channel_name, nicks);
            }
        });
    }

    function _addGlobalChannelNamesListener () {
        if (LISTENERS.server['names'] != undefined)
            return;
        LISTENERS.server['names'] = '';
        client.addListener('names', function (channel, nicks) {
                //console.log("++++++++++++++GLOBAL CHANNEL NAMES LISTENERS: " + channel + ' ' + user.username + ' ' + user_server.name);
                //console.log(nicks);
            Fiber(function () {
                //console.log(nicks);
                var user_channel = UserChannels.findOne({
                    name: channel, active: true, user: user.username});
                if (user_channel) {
                    _updateChannelNicks(user_channel.name, nicks);
                }
            }).run();
        });
    }

    function whoToWhoisInfo (nick, who_info) {
      var whoisInfo = {
        nick: nick,
        user: who_info.user,
        server: who_info.server,
        realname: who_info.gecos,
        host: who_info.host,
      }
      if (who_info.nick_status.search('G') >= 0)
        whoisInfo['away'] = true;
      else
        whoisInfo['away'] = false;
      return whoisInfo;
    }

    function _update_channel_nicks_from_who_data (message) {
      _updateChannelNicks(message.channel, message.nicks);
    }

    function _addWhoListener () {
      if (LISTENERS.server['who'] != undefined)
        return;
      LISTENERS.server['who'] = '';
      client.addListener('who', function (message) {
        try {
            if (!message)
                return;
            var key = user_server.name + '-' + message.channel;
            if (WHO_DATA_POLL_LOCK[key] == user.username)
                WHO_DATA_POLL_LOCK[key] = "";
            if (message) {
              for (nick in message.nicks) {
                var who_info = message.nicks[nick];
                var whoisInfo = whoToWhoisInfo(nick, who_info);
                _create_update_server_nick(whoisInfo);
              }
              _updateChannelNicks(message.channel, message.nicks);
            }
        } catch (err) {
            logger.error(err);
        }
      });
    }

    function _getChannelWHOData (channel_name) {
        var key = user_server.name + '-' + channel_name;
        if (!WHO_DATA_POLL_LOCK[key] || WHO_DATA_POLL_LOCK[key] == user.username) {
            WHO_DATA_POLL_LOCK[key] = user.username;
            client.send('who', channel_name);
        }
    }

    function _addChannelJoinListener (channel_name) {

    }

    function _addGlobalChannelJoinListener () {
        if (LISTENERS.server['join'] != undefined)
            return;
        LISTENERS.server['join'] = '';
        // remove any pre existing 'join' listener
        var listeners = client.listeners('join');
        _.each(listeners, function (listener) {
            client.removeListener('join', listener);
        });
        client.addListener('join', function (channel, nick, message) {
            enqueueTask(URGENT_QUEUE, function () {
                Fiber(function () {
                    var user_channel = _create_update_user_channel(
                        user_server, {name: channel});
                    if (nick == client.nick) {
                        /*
                        var job_key = 'WHO-' + channel;
                        if (JOBS[job_key])
                            clearInterval(JOBS[job_key]);
                        JOBS[job_key] = setInterval(
                            _getChannelWHOData, CONFIG.channel_who_poll_interval,
                            channel);
                        */
                        console.log(user_channel);
                        UserChannels.update(
                            {_id: user_channel._id}, {$set: {active: true}},
                            {multi: true}, function (err, updated) {});
                        _addChannelJoinListener(user_channel.name);
                        _addChannelPartListener(user_channel.name);
                        _joinChannelCallback(message, user_channel);
                    }
                    channel_listeners_manager.addChannelClient(
                        user_server.name, channel, client.nick,
                        user.username);
                    var channel_join_message = nick + ' has joined the channel.';
                    if (nick == client.nick)
                        channel_join_message = 'You have joined the channel.';
                    ChannelLogs.insert({
                        message: channel_join_message,
                        raw_message: message,
                        from: null,
                        from_user: null,
                        from_user_id: null,
                        channel_name: user_channel.name,
                        channel_id: user_channel._id,
                        server_name: user_server.name,
                        server_id: user_server._id,
                        user: user.username,
                        user_id: user._id,
                        created: new Date(),
                        last_updated: new Date(),
                        type: 'ChannelJoin'
                    }, function (err, id) {});
                }).run();
            });
        });
    }

    function _addChannelPartListener (channel_name) {
        if (LISTENERS.channel['part' + channel_name] != undefined)
            return;
        LISTENERS.channel['part' + channel_name] = '';
        client.addListener('part' + channel_name, function (nick, reason, message) {
            enqueueTask(URGENT_QUEUE, function () {
                Fiber(function () {
                    channel_listeners_manager.removeChannelClient(
                        user_server.name, channel_name, client.nick,
                        user.username);
                    var channel = UserChannels.findOne(
                        {user_server_id: user_server._id, name: channel_name});
                    if (!channel)
                        return;
                    var part_message = "";
                    if (nick == client.nick)
                        part_message = 'You have left';
                    else
                        part_message = nick + ' has left';
                    if (reason)
                        part_message += ' (' + reason + ')';
                    ChannelLogs.insert({
                        message: part_message,
                        raw_message: message,
                        from: null,
                        from_user: null,
                        from_user_id: null,
                        channel_name: channel.name,
                        channel_id: channel._id,
                        server_name: user_server.name,
                        server_id: user_server._id,
                        user: user.username,
                        user_id: user._id,
                        created: new Date(),
                        last_updated: new Date(),
                        type: 'ChannelPart'
                    }, function (err, id) {});
                    if (channels_listening_to[channel_name])
                        delete channels_listening_to[channel_name];
                }).run();
            });
        });
    }

    function _addServerQuitListener () {
        if (LISTENERS.server['quit'] != undefined)
            return;
        LISTENERS.server['quit'] = '';
        client.addListener('quit', function (nick, reason, channels, message) {
            channel_listeners_manager.removeNickFromChannels(
                user_server.name, channels, nick);
            enqueueTask(URGENT_QUEUE, function () {
                Fiber(function () {
                    UserChannels.find({
                        user_server_name: user_server.name,
                        user: user.username, name: {$in: channels}
                    }).forEach(function (channel) {
                        var part_message = "";
                        if (nick == client.nick)
                            part_message = 'You have left IRC';
                        else
                            part_message = nick + ' has left IRC';
                        if (reason)
                            part_message += ' (' + reason + ')';
                        enqueueTask(URGENT_QUEUE, function () {
                            Fiber(function () {
                                ChannelLogs.insert({
                                    message: part_message,
                                    raw_message: message,
                                    from: null,
                                    from_user: null,
                                    from_user_id: null,
                                    channel_name: channel.name,
                                    channel_id: channel._id,
                                    server_name: user_server.name,
                                    server_id: user_server._id,
                                    user: user.username,
                                    user_id: user._id,
                                    created: new Date(),
                                    last_updated: new Date(),
                                    type: 'QUITIRC'
                                }, function (err, id) {});
                            }).run();
                        });
                    });
                }).run();
            });
        });
    }

    function _addChannelTopicListener () {
        if (LISTENERS.server['topic'] != undefined)
            return;
        LISTENERS.server['topic'] = '';
        client.addListener('topic', function (channel, topic, nick, message) {
            enqueueTask(URGENT_QUEUE, function () {
                Fiber(function () {
                    UserChannels.update({
                        name: channel, user_server_id: user_server._id,
                        user: user.username
                    }, {$set: {topic: topic}});
                }).run();
            });
        });
    }

    function _addSelfMessageListener (argument) {
        client.addListener('selfMessageSent', function (target, message) {
        })
    }

    function _addWhoisListener (info) {
    }

    function _addNickChangeListener () {
        if (LISTENERS.server['nick'] != undefined)
            return;
        LISTENERS.server['nick'] = '';
        // Remove any pre existing NICK listener
        _.each(client.listeners('nick'), function (listener) {
            client.removeListener('nick', listener);
        });
        client.addListener('nick', function (
                oldnick, newnick, channels, message) {
            // Update channel nick from old nick to new nick
            enqueueTask(DELAYED_QUEUE, function () {
                Fiber(function () {
                    try {
                        ChannelNicks.update(
                            {
                                nick: oldnick, channel_name: {$in: channels},
                                server_name: user_server.name
                            },
                            {$set: {nick: newnick}},
                            {multi: true},
                            function (err, updated) {}
                        );
                    } catch (err) {
                        logger.info('ChannelNicksUpsertError', {error: err});
                    }
                }).run();
            });

            enqueueTask(DELAYED_QUEUE, function () {
                // Log nick change for active and connected user channels.
                Fiber(function () {
                    UserChannels.find(
                        {
                            user_server_id: user_server._id, name: {$in: channels},
                            active: true, status: 'connected'
                        }
                    ).forEach(function (channel) {
                        ChannelLogs.insert({
                            message: oldnick + ' has changed nick to ' + newnick,
                            raw_message: '',
                            from: '',
                            from_user: null,
                            from_user_id: null,
                            channel_name: channel.name,
                            channel_id: channel._id,
                            server_name: user_server.name,
                            server_id: user_server._id,
                            user: user.username,
                            user_id: user._id,
                            created: new Date(),
                            last_updated: new Date(),
                            type: 'NICK'
                        }, function (err, id) {});
                    });
                }).run();
            });
        })
    }

    function _addPMListener () {
        if (LISTENERS.server['message'] != undefined)
            return;
        LISTENERS.server['message'] = '';
        // Remove any pre existing PM listener
        var listeners = client.listeners('message');
        _.each(listeners, function (listener) {
            client.removeListener('message', listener);
        });
        client.addListener('message', function (nick, to, text, message) {
            //console.log(nick + ', ' + to + ', ' + text + ', ' + message);
            enqueueTask(URGENT_QUEUE, function () {
                Fiber(function () {
                    if (to == client.nick) {
                        var profile = user.profile;
                        var userpms = UserPms.findOne({user_id: user._id}) || {pms: {}};
                        userpms.pms[nick] = "";
                        UserPms.upsert(
                            {user_id: user._id, 
                             user_server_id: user_server._id,
                             user_server_name: user_server.name,
                             user: user.username}, 
                             {$set: {pms: userpms.pms}});

                        var from_user = Meteor.users.findOne({username: nick}) || {};
                        var to_user = user;
                        PMLogs.insert({
                            message: text,
                            raw_message: message,
                            from: nick,
                            display_from: nick,
                            from_user: from_user.username,
                            from_user_id: from_user._id,
                            to_nick: to,
                            to_user: to_user.username,
                            to_user_id: to_user._id,
                            server_name: user_server.name,
                            server_id: user_server._id,
                            user: user.username,
                            user_id: user._id,
                            created: new Date(),
                            last_updated: new Date()
                        }, function (err, id) {});
                        if (_.isUndefined(Meteor.presences.findOne(
                                {userId: user._id}))) {
                            waartaa.notifications.notify_pm(
                                user, nick, text, user_server);
                        }
                    }
                }).run();
            });
        });
    }

    function _addRawMessageListener() {
        client.addListener('raw', function (message) {
            if (CONFIG.DEBUG)
                console.log(message);
        });
    }

    function set_user_away (message) {
        client.send('AWAY', message);
    }

    function set_user_active () {
        client.send('AWAY', '');
    }

    function _pollUserStatus (interval) {
        var job_key = 'POLL_USER_STATUS';
        if (JOBS[job_key])
            Meteor.clearInterval(JOBS[job_key]);
        JOBS[job_key] = Meteor.setInterval(function () {
            var presence = Meteor.presences.findOne({userId: user._id});
            if (presence && user_status != "active") {
                set_user_active();
                user_status = "active";
            }
            else if (_.isUndefined(presence) && user_status != "away") {
                set_user_away("I am not around!");
                user_status = "away";
            }
        }, interval);
    }

    function _joinServerCallback (message) {
        /**
         * It's the responsiblity of the calling function to decide
         * whether to run this inside Fiber or not.
         */
        UserServers.update({_id: user_server._id}, {$set: {
            status: 'connected'}
        });
        _addWhoListener();
        _addServerQuitListener();
        _addChannelTopicListener();
        _addNoticeListener();
        _addCtcpListener();
        _addSelfMessageListener();
        _addPMListener();
        _addNickChangeListener();
        _addRawMessageListener();
        _addGlobalChannelJoinListener();
        _addGlobalChannelNamesListener();
        _pollUserStatus(60 * 1000);
        UserChannels.find(
        {
            active: true, user: user.username,
            status: {$nin: ['user_disconnected', 'admin_disconnected']},
            user_server_name: user_server.name
        }).forEach(function (channel) {
            _addChannelNamesListener(channel.name);
            _addChannelJoinListener(channel.name);
            _addChannelPartListener(channel.name);
            client.join(channel.name, function (message) {
                _joinChannelCallback(message, channel);
            });
        });
        disconnectConnectingChannelsOnTimeout(20000);
        client.addListener('notice', function (nick, to, text, message) {
            if (nick == null) {
                // NOTICE from server
            }
        });
        client.addListener('error', function (err) {
            Fiber(function () {
            }).run();
        });
    }

    function _addNoticeListener () {
        if (LISTENERS.server['notice'] != undefined)
            return;
        LISTENERS.server['notice'] = '';
        client.addListener('notice', function (nick, to, text, message) {
            enqueueTask(URGENT_QUEUE, function () {
                Fiber(function () {
                    if (nick == 'NickServ' || nick == null) {
                        UserServerLogs.insert({
                            message: text,
                            raw_message: message,
                            from: nick,
                            from_user: null,
                            from_user_id: null,
                            server_name: user_server.name,
                            server_id: user_server._id,
                            user: user.username,
                            user_id: user._id,
                            created: new Date(),
                            last_updated: new Date()
                        }, function (err, id) {});
                    } else if (nick == 'ChanServ') {
                        try {
                            var channel_name = text.split(']')[0].substr(1);
                            var channel = UserChannels.findOne({
                                name: channel_name,
                                user_server_id: user_server._id,
                                user: user.username
                            });
                            if (channel)
                                ChannelLogs.insert({
                                    message: text,
                                    raw_message: message,
                                    from: nick,
                                    from_user: null,
                                    from_user_id: null,
                                    channel_name: channel.name,
                                    channel_id: channel._id,
                                    server_name: user_server.name,
                                    server_id: user_server._id,
                                    user: user.username,
                                    user_id: user._id,
                                    created: new Date(),
                                    last_updated: new Date(),
                                    type: 'ChannelNotice'
                                }, function (err, id) {});
                        } catch (err) {
                        }
                    }
                }).run();
            });
        });
    }

    function _writeChannelActionMessage (channel, from, text, message) {
        if (!channel_listeners_manager.isClientListener(
                user_server.name, channel.name, client.nick))
            return;
        if (typeof(CHANNEL_LOGS_WRITE_LOCKS[user_server.name]) == 'undefined')
            CHANNEL_LOGS_WRITE_LOCKS[user_server.name] = {};
        if (typeof(CHANNEL_LOGS_WRITE_LOCKS[user_server.name][channel.name]) == 'undefined')
            CHANNEL_LOGS_WRITE_LOCKS[user_server.name][channel.name] = new locks.createReadWriteLock();
        var rwlock = CHANNEL_LOGS_WRITE_LOCKS[user_server.name][channel.name];
        var global = true;
        var not_for_user = from;
        rwlock.timedWriteLock(5000, function (error) {
            Fiber(function () {
                if (error) {
                    console.log('Could not get the lock within 5 seconds, so gave up');
                } else {
                    console.log('Acquired write lock', user_server.name, channel.name);
                    var shall_wrtite = shallWriteChannelLog(
                        from, text, channel.name, user_server.name,
                        client.nick);
                    rwlock.unlock();
                    if (shall_wrtite) {
                        ChannelLogs.insert({
                            message: text,
                            raw_message: message,
                            from: '',
                            from_user: user.username,
                            from_user_id: user._id,
                            channel_name: channel.name,
                            channel_id: channel._id,
                            server_name: user_server.name,
                            server_id: user_server._id,
                            user: user.username,
                            user_id: user._id,
                            global: global,
                            not_for_user: not_for_user,
                            created: new Date(),
                            last_updated: new Date()
                        }, function (err, id) {});
                    }
                }
            }).run();
        });
    }

    function _addCtcpListener () {
        if (LISTENERS.server['ctcp'] != undefined)
            return;
        LISTENERS.server['ctcp'] = '';
        client.addListener('ctcp', function (from, to, text, type, message) {
            enqueueTask(URGENT_QUEUE, function () {
                Fiber(function () {
                    try {
                        if (type == 'privmsg' && text.search('ACTION') == 0) {
                            text = text.replace('ACTION', from);
                            if (to[0] == '#') {
                                var channel = UserChannels.findOne({
                                    name: to,
                                    user_server_id: user_server._id
                                });
                                if (!channel)
                                    return;
                                    _writeChannelActionMessage(
                                        channel, from, text, message);
                            } else {
                                PMLogs.insert({
                                  message: text,
                                  raw_message: message,
                                  from: from,
                                  display_from: '',
                                  from_user: user.username,
                                  from_user_id: user._id,
                                  to_nick: to,
                                  to_user: '',
                                  to_user_id: '',
                                  server_name: user_server.name,
                                  server_id: user_server._id,
                                  user: user.username,
                                  user_id: user._id,
                                  created: new Date(),
                                  last_updated: new Date()
                                }, function (err, id) {});
                            }
                        }
                    } catch (err) {
                        logger.error(err);
                    }
                }).run();
            });
        });
    }

    function _partChannelCallback (message, channel_name) {
        channel_listeners_manager.removeChannelClient(
            user_server.name, channel_name, client.nick, user.username);
        var listeners = client.listeners('message' + channel_name);
        _.each(listeners, function (listener) {
            client.removeListener('message' + channel_name, listener);
        })
        Fiber(function() {
            UserChannels.update(
                {name: channel_name, user_server_id: user_server._id},
                {$set: {status: 'user_disconnected'}});
        }).run();
        for (job in JOBS) {
            if (job.search(channel_name) >= 0)
                Meteor.clearInterval(JOBS[job]);
        }
    }

    function _partUserServerCallback (message, user_server, client) {
        Fiber(function () {
            UserServers.update(
                {_id: user_server._id},
                {$set: {status: 'user_disconnected'}}
            );
        }).run();
        Fiber(function () {
            UserChannels.update(
                {
                    user_server_id: user_server._id,
                    status: {$nin: ['user_disconnected', 'admin_disconnected']}
                },
                {$set: {status: 'disconnected'}},
                {multi: true}
            );
        }).run();
        Fiber(function () {
            UserChannels.find(
                {user_server_id: user_server._id}).forEach(function (channel) {
                    var key = user_server.name + '-' + channel.name;
                    if (WHO_DATA_POLL_LOCK[key] == user.username)
                        WHO_DATA_POLL_LOCK[key] = '';
                });
        }).run();
        for (job in JOBS) {
            Meteor.clearInterval(JOBS[job]);
            JOBS[job] = '';
        }
    }

    function _create_update_user_channel (user_server, channel_data) {
        UserChannels.update(
            {
                name: channel_data.name, user_server_id: user_server._id,
                user: user.username
            },
            {$set: {
                password: channel_data.password,
                user_id: user._id,
                user_server_name: user_server.name,
                last_updated: new Date(),
                last_updater: user.username,
                last_updater_id: user._id}
            },
            {upsert: true}
        );
        var user_channel = UserChannels.findOne(
            {
                name: channel_data.name, user_server_id: user_server._id,
                user: user.username
            }
        );
        return user_channel;
    }

    function _create_update_server_nick (info) {
        info['last_updated'] = new Date();
        info['server_name'] = user_server.name;
        info['server_id'] = user_server.server_id;
        // SmartCollections does not support 'upsert'
        //ServerNicks.upsert({
        //  server_name: user_server.name, nick: info.nick},
        //  {$set: info}
        //);
        Fiber(function () {
            var server_nick = ServerNicks.findOne(
                {server_name: user_server.name, nick: info.nick});
            if (server_nick) {
                for (key in info) {
                    if (info[key] == server_nick[key])
                        delete info[key];
                }
            }
            ServerNicks.update(
                {server_name: user_server.name, nick: info.nick},
                {$set: info},
                {upsert: true},
                function (err, updated) {}
            );
        }).run();
    }

    function _getLogsFromWhoisInfo(info) {
        if (!info)
            return;
        var logs = [];
        logs.push(
            info.nick + ' has userhost ' + info.user + '@' + info.host
            + ' and realname ' + info.realname);
        if (info.channels)
            logs.push(info.nick + ' is on ' + info.channels.join(', '));
        if (info.serverInfo)
            logs.push(
                info.nick + ' is connected on ' + info.server + ' (' +
                info.serverInfo + ')');
        if (info.account)
            logs.push(info.nick + ' ' + info.accountInfo + ' ' + info.account);
        return logs;
    }

    function _saveWhoisResponseAsChatLog(info, log_options) {
        Fiber(function () {
            if (!log_options)
                return;
            var whoisLogs = _getLogsFromWhoisInfo(info);
            if (log_options.roomtype == 'channel') {
                var channel = UserChannels.findOne({
                    _id: log_options.room_id, user_server_id: user_server._id});
                if (!channel)
                    return;
                _.each(whoisLogs, function (text) {
                    ChannelLogs.insert({
                        message: text,
                        raw_message: info,
                        from: "WHOIS",
                        from_user: null,
                        from_user_id: null,
                        channel_name: channel.name,
                        channel_id: channel._id,
                        server_name: user_server.name,
                        server_id: user_server._id,
                        user: user.username,
                        user_id: user._id,
                        created: new Date(),
                        last_updated: new Date(),
                        type: 'CMDRESP'
                    }, function (err, id) {});
                });
            } else if (log_options.roomtype == 'pm') {
                var to = log_options.room_id.substr(
                    log_options.room_id.indexOf('_') + 1);
                _.each(whoisLogs, function (text) {
                    PMLogs.insert({
                      message: text,
                      raw_message: {},
                      from: to,
                      display_from: 'WHOIS',
                      from_user: null,
                      from_user_id: null,
                      to_nick: client.nick,
                      to_user: user.username,
                      to_user_id: user._id,
                      server_name: user_server.name,
                      server_id: user_server._id,
                      user: user.username,
                      user_id: user._id,
                      created: new Date(),
                      last_updated: new Date()
                    }, function (err, id) {});
                });
            } else if (log_options.roomtype == 'server') {
                _.each(whoisLogs, function (text) {
                    UserServerLogs.insert({
                        message: text,
                        raw_message: {},
                        from: 'WHOIS',
                        from_user: null,
                        from_user_id: null,
                        server_name: user_server.name,
                        server_id: user_server._id,
                        user: user.username,
                        user_id: user._id,
                        created: new Date(),
                        last_updated: new Date()
                    }, function (err, id) {});
                });
            }
        }).run();
    }

    function _whois_callback (info, log_options) {
        _create_update_server_nick(info);
        _saveWhoisResponseAsChatLog(info, log_options);
    }

    function _logIncomingMessage (message, log_options) {
        Fiber(function () {
            if (log_options.roomtype == 'channel') {
                var channel = UserChannels.findOne(
                    {
                        _id: log_options.room_id,
                        user_server_id: user_server._id
                    }, {_id: 1, name: 1});
                if (!channel)
                    return;
                ChannelLogs.insert({
                    message: message,
                    raw_message: {},
                    from: client.nick,
                    from_user: user.username,
                    from_user_id: user._id,
                    channel_name: channel.name,
                    channel_id: channel._id,
                    server_name: user_server.name,
                    server_id: user_server._id,
                    user: user.username,
                    user_id: user._id,
                    created: new Date(),
                    last_updated: new Date()
                }, function (err, id) {});
            } else if (log_options.roomtype == 'pm') {
                var to = log_options.room_id.substr(
                    log_options.room_id.indexOf('_') + 1);
                PMLogs.insert({
                  message: message,
                  raw_message: {},
                  from: client.nick,
                  display_from: client.nick,
                  from_user: user.username,
                  from_user_id: user._id,
                  to_nick: to,
                  to_user: '',
                  to_user_id: '',
                  server_name: user_server.name,
                  server_id: user_server._id,
                  user: user.username,
                  user_id: user._id,
                  created: new Date(),
                  last_updated: new Date()
                }, function (err, id) {});
            } else if (log_options.roomtype == 'server') {
                UserServerLogs.insert({
                    message: message,
                    raw_message: {},
                    from: client.nick,
                    from_user: null,
                    from_user_id: null,
                    server_name: user_server.name,
                    server_id: user_server._id,
                    user: user.username,
                    user_id: user._id,
                    created: new Date(),
                    last_updated: new Date()
                }, function (err, id) {});
            }
        }).run();
    }

    function disconnectConnectingChannelsOnTimeout (timeout, channel_names) {
        Meteor.setTimeout(function () {
            Fiber(function () {
                var query = {user_server_id: user_server._id, status: 'connecting'};
                if (channel_names)
                    query['name'] = {$in: channel_names};
                UserChannels.update(
                    query,
                    {$set: {status: 'disconnected'}},
                    {multi: true}
                );
            }).run();
        }, timeout);
    }

    function disconnectConnectingServerOnTimeout (timeout) {
        Meteor.setTimeout(function () {
            Fiber(function () {
                UserServers.update(
                    {_id: user_server._id, status: 'connecting'},
                    {$set: {status: 'disconnected'}}
                );
            }).run();
        }, timeout);
        disconnectConnectingChannelsOnTimeout(timeout);
    }

    function _sendPMMessage(to, message, action, send) {
        try {
            if (message.search('/me') == 0)
                message = message.replace('/me', client.nick);
            PMLogs.insert({
              message: message,
              raw_message: {},
              from: client.nick,
              display_from: action? '': client.nick,
              from_user: user.username,
              from_user_id: user._id,
              to_nick: to,
              to_user: '',
              to_user_id: '',
              server_name: user_server.name,
              server_id: user_server._id,
              user: user.username,
              user_id: user._id,
              created: new Date(),
              last_updated: new Date()
            }, function (err, id) {});
            if (send)
                client.say(to, message);
        } catch (err) {
            logger.error(err);
        }
    }

    return {
        joinChannel: function (channel_name, password) {
            try {
                _addChannelNamesListener(channel_name);
                _addChannelJoinListener(channel_name);
                _addChannelPartListener(channel_name);
                if (password) {
                    client.send('JOIN', channel_name, password);
                } else {
                    client.join(channel_name, function (message) {
                        Fiber(function () {
                            var channel = _create_update_user_channel(
                                user_server, {
                                    name: channel_name, password: password});
                            _joinChannelCallback(message, channel);
                        }).run();
                    });
                }
            } catch (err) {
                logger.error(err);
            }
            disconnectConnectingChannelsOnTimeout(20000, [channel_name]);
        },
        partChannel: function (channel_name) {
            try {
                var client = client_data[user_server.name];
                channel_listeners_manager.removeChannelClient(
                    user_server.name, channel_name, client.nick, user.username);
                client.part(channel_name, function (message) {
                    _partChannelCallback(
                        message, channel_name);
                });
            } catch (err) {
                logger.error(err);
            }
        },
        create_update_user_channel: function (channel_data) {
            try {
                Fiber(function () {
                    _create_update_user_channel(user_server, channel_data);
                }).run();
            } catch (err) {
                logger.error(err);
            }
        },
        removeChannel: function (channel) {},
        joinUserServer: function () {
            SERVER_JOIN_QUEUE.add(function (done) {
                console.log('=======JOINING SERVER========', user_server.name, user.username);
                var timeoutId = Meteor.setTimeout(function () {
                        done();
                    }, 90000);
                Fiber(function () {
                    try {
                        fs.writeFileSync(CONFIG.IDENT_FILE_PATH, 'global { reply "' + user.username + '" }');
                    } catch (err) {
                        console.log(err);
                    }
                    try {
                        var server = Servers.findOne({name: user_server.name});
                        var server_url = server.connections[0].url;
                        var server_port = server.connections[0].port || '6667';
                        var nick = user_server.nick;
                        var client_options = {
                            autoConnect: false,
                            port: ssl_credentials? '6697': server_port,
                            userName: nick,
                            realName: user_server.real_name || '~',
                            secure: ssl_credentials,
                            selfSigned: true,
                            certExpired: true,
                            debug: CONFIG.DEBUG
                        };
                        client = new irc.Client(server_url, nick, client_options);
                        client_data[server.name] = client;
                        UserServers.update(
                            {_id: user_server._id, status: {$nin: ['user_disconnected', 'admin_disconnected']}},
                            {
                                $set: {status: 'connecting', active: true}
                            },
                            {multi: true}
                        );
                        UserChannels.update(
                            {
                                user_server_name: user_server.name,
                                user: user.username,
                                status: {$nin: ['user_disconnected', 'admin_disconnected']}
                            },
                            {$set: {status: 'connecting'}},
                            {multi: true}
                        );
                        if (LISTENERS.server['nickSet'] != undefined)
                            return;
                        LISTENERS.server['nickSet'] = '';
                        client.addListener('nickSet', function (nick) {
                            Fiber(function () {
                                if (user_server.current_nick != nick) {
                                    ChannelNicks.remove(
                                        {
                                            server_name: user_server.name,
                                            nick: user_server.current_nick
                                        }
                                    );
                                    UserServers.update({_id: user_server._id}, {$set: {current_nick: nick}});
                                    user_server = UserServers.findOne({_id: user_server._id});
                                    UserChannels.find(
                                        {
                                            user_server_name: user_server.name,
                                            user: user.username
                                        }).forEach(function (channel) {
                                            try {
                                                ChannelNicks.update(
                                                    {
                                                        server_name: user_server.name,
                                                        channel_name: channel.name,
                                                        nick: nick
                                                    },
                                                    {$set: {}},
                                                    {upsert: true, multi: true},
                                                    function (err, updated) {}
                                                );
                                            } catch (err) {
                                                logger.info(
                                                    'ChannelNicksUpsertError',
                                                    {error: err})
                                            }
                                        });
                                }
                            }).run();
                        });
                        client.connect(function (message) {
                            Fiber(function () {
                                _joinServerCallback(message);
                                done();
                                console.log(
                                    '========JOINED SERVER=========',
                                    user_server.name, user.username);
                                Meteor.clearTimeout(timeoutId);
                            }).run();
                        });
                        disconnectConnectingServerOnTimeout(30000);
                    } catch (err) {
                        logger.error(err);
                        done();
                        Meteor.clearTimeout(timeoutId);
                    }
                }).run();
            });
        },
        partUserServer: function () {
            try {
                var client = client_data[user_server.name];
                client.disconnect(
                    CONFIG['SERVER_QUIT_MESSAGE'] || '', function (message) {
                    _partUserServerCallback(message, user_server, client);
                });
            } catch (err) {

            }
        },
        addUserServer: function (server_data) {
            try {
                var now = new Date();
                var user_server_id = UserServers.insert({
                    name: server_data.server.name,
                    server_id: server_data.server._id,
                    nick: server_data.nick,
                    password: server_data.password,
                    user: user,
                    user_id: user._id,
                    created: now,
                    creator: user,
                    creator_id: user._id,
                    last_updated: now,
                    last_updater: user,
                    last_updater_id: user._id,
                });
                var user_server = UserServers.findOne({_id: user_server_id});
                _.each(server_data.channels, function (item) {
                    create_update_user_channel(user_server, item);
                });
            } catch (err) {
                logger.error(err);
            }
        },
        markAway: function (message) {
            try {
                Fiber(function () {
                    UserServers.update({_id: user_server._id}, {$set: {away_msg: message}});
                    client.send('AWAY', message);
                }).run();
            } catch (err) {
                logger.error(err);
            }
        },
        markActive: function () {
            try {
                client.send('AWAY', '');
            } catch (err) {
                logger.error(err);
            }
        },
        removeServer: function (server_id, user_id) {},
        updateServer: function (server_id, server_data, user_id) {},
        sendChannelMessage: function (channel_name, message, action, send, log) {
            try {
                var channel = UserChannels.findOne({
                  name: channel_name,
                  user_server_id: user_server._id,
                }) || {};
                if (message.search('/me') == 0)
                    message = message.replace('/me', client.nick);
                if (log)
                    ChannelLogs.insert({
                        message: message,
                        raw_message: {},
                        from: action? '': client.nick,
                        from_user: user.username,
                        from_user_id: user._id,
                        channel_name: channel.name,
                        channel_id: channel._id,
                        server_name: user_server.name,
                        server_id: user_server._id,
                        user: user.username,
                        user_id: user._id,
                        created: new Date(),
                        last_updated: new Date()
                    });
                if (send)
                    client.say(channel_name, message);
            } catch (err) {
                logger.error(err);
            }
        },
        changeNick: function (nick) {
            try {
                client.send('NICK', nick);
            } catch (err) {
                logger.error(err);
            }
        },
        sendServerMessage: function (message) {
            try {
                UserServerLogs.insert({
                    message: message,
                    raw_message: message,
                    from: client.nick,
                    from_user: user.username,
                    from_user_id: user.user_id,
                    server_name: user_server.name,
                    server_id: user_server._id,
                    user: user.username,
                    user_id: user._id,
                    created: new Date(),
                    last_updated: new Date()
                });
            } catch (err) {
                logger.error(err);
            }
        },
        sendPMMessage: function (to, message, action, send) {
            _sendPMMessage(to, message, action, send);
        },
        getServerClient: function (server_id, user_id) {},
        isServerConnected: function (server_id) {},
        sendRawMessage: function (message, log_options) {
            //try {
                var args = message.substr(1).split(' ');
                if (log_options && (args[0] == 'whois' || args[0] == 'WHOIS')) {
                    client.whois(args[1], function (info) {
                        /*
                        if (log_options.logInput) {
                            _logIncomingMessage(message, log_options);
                        }
                        */
                        _whois_callback(info, log_options);
                    });
                } else if (args[0] == 'me') {
                    client.action(
                        log_options.target, args.slice(1).join(" "));
                } else if (args[0].toLowerCase() == 'msg') {
                    if (args[1].toLowerCase() == 'nickserv') {
                        client.say('NickServ', args.slice(2).join(' '));
                    } else {
                        var userpms = UserPms.findOne(
                            {user_id: user._id}) || {pms: {}};
                        userpms.pms[args[1]] = "";
                        UserPms.upsert(
                            {user_id: user._id,
                             user_server_id: user_server._id,
                             user_server_name: user_server.name,
                             user: user.username},
                             {$set: {pms: userpms.pms}});
                        _sendPMMessage(args[1], args.slice(2).join(' '));
                    }
                } else
                    client.send.apply(client, args);
            //} catch (err) {
            //    logger.error(err);
            //}
        }
    }
};
