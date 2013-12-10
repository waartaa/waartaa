Meteor.startup(function () {
    WHO_DATA_POLL_LOCK = {};
});

IRCHandler = function (user, user_server) {
    var client_data = {};
    var client = null;
    var user_status = "";
    var channels_listening_to = {};
    var LISTENERS = {
        server: {},
        channel: {}
    };
    var JOBS = {}

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
        Fiber(function () {
            if (channel.status == 'connected')
                return;
            UserChannels.update({_id: channel._id}, {$set: {status: 'connected'}});
            if (LISTENERS.channel['message' + channel.name] != undefined)
                return;
            LISTENERS.channel['message', channel.name] = '';
            client.addListener('message' + channel.name, function (
                    nick, text, message) {
                Fiber(function () {
                    UserChannelLogs.insert({
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
                        last_updated: new Date()
                    });
                }).run();
            });
        }).run();
    }

    function _updateChannelNicks (channel_name, nicks) {
        var nicks_list = [];
        for (nick in nicks) {
            nicks_list.push(nick);
        }
        ChannelNicks.remove(
            {
                channel_name: channel_name, server_name: user_server.name,
                nick: {$nin: nicks_list}
            }
        );
        _.each(nicks_list, function (nick) {
            ChannelNicks.update(
                {channel_name: channel_name, server_name: user_server.name,
                 nick: nick},
                {$set: {last_updated: new Date()}},
                {upsert: true}
            )
        });
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
        }
    }

    function _addChannelNamesListener (channel_name) {
        if (LISTENERS.channel['names' + channel_name] != undefined)
            return;
        LISTENERS.channel['names' + channel_name] = '';
        client.addListener('names' + channel_name, function (nicks) {
            Fiber(function () {
                _updateChannelNicks(channel_name, nicks);
            }).run();
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
                Fiber(function () {
                  for (nick in message.nicks) {
                    var who_info = message.nicks[nick];
                    var whoisInfo = whoToWhoisInfo(nick, who_info);
                    _create_update_server_nick(whoisInfo);
                  }
                  _updateChannelNicks(message.channel, message.nicks);
                }).run();
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
        client.addListener('join', function (channel, nick, message) {
            Fiber(function () {
                var user_channel = _create_update_user_channel(
                    user_server, {name: channel});
                ChannelNicks.update(
                    {
                        nick: nick, channel_name: channel,
                        server_name: user_server.name
                    },
                    {$set: {last_updated: new Date()}},
                    {upsert: true}
                );
                if (nick == client.nick) {
                    var job_key = 'WHO-' + channel;
                    if (JOBS[job_key])
                        clearInterval(JOBS[job_key]);
                    JOBS[job_key] = setInterval(
                        _getChannelWHOData, CONFIG.channel_who_poll_interval,
                        channel);
                    console.log(user_channel);
                    UserChannels.update(
                        {_id: user_channel._id}, {$set: {active: true}}, {  multi: true});
                    _addChannelJoinListener(user_channel.name);
                    _addChannelPartListener(user_channel.name);
                    _joinChannelCallback(message, user_channel);
                }
                var channel_join_message = nick + ' has joined the channel.';
                if (nick == client.nick)
                    channel_join_message = 'You have joined the channel.';
                UserChannelLogs.insert({
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
                });
            }).run();
        });
    }

    function _addChannelPartListener (channel_name) {
        if (LISTENERS.channel['part' + channel_name] != undefined)
            return;
        LISTENERS.channel['part' + channel_name] = '';
        client.addListener('part' + channel_name, function (nick, reason, message) {
            Fiber(function () {
                ChannelNicks.remove(
                  {
                    channel_name: channel_name, server_name: user_server.name,
                    nick: nick
                  }
                );
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
                UserChannelLogs.insert({
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
                });
                if (channels_listening_to[channel_name])
                    delete channels_listening_to[channel_name];
            }).run();
        });
    }

    function _addServerQuitListener () {
        if (LISTENERS.server['quit'] != undefined)
            return;
        LISTENERS.server['quit'] = '';
        client.addListener('quit', function (nick, reason, channels, message) {
            Fiber(function () {
                ChannelNicks.remove(
                    {nick: nick, channel_name: {$in: channels},
                    server_name: user_server.name});
            }).run();
        });
    }

    function _addChannelTopicListener () {
        if (LISTENERS.server['topic'] != undefined)
            return;
        LISTENERS.server['topic'] = '';
        client.addListener('topic', function (channel, topic, nick, message) {
            Fiber(function () {
                UserChannels.update({
                    name: channel, user_server_id: user_server._id,
                    user: user.username
                }, {$set: {topic: topic}});
            }).run();
        });
    }

    function _addSelfMessageListener (argument) {
        client.addListener('selfMessageSent', function (target, message) {
        })
    }

    function _addWhoisListener (info) {
    }

    function _addPMListener () {
        if (LISTENERS.server['message'] != undefined)
            return;
        LISTENERS.server['message'] = '';
        client.addListener('message', function (nick, to, text, message) {
            //console.log(nick + ', ' + to + ', ' + text + ', ' + message);
            Fiber(function () {
                if (to == client.nick) {
                    var profile = user.profile;
                    profile.connections[user_server._id].pms[nick] = "";
                    Meteor.users.update({_id: user._id}, {$set: {profile: profile}});
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
                    });
                }
            }).run();
        });
    }

    function _addRawMessageListener() {
        client.addListener('raw', function (message) {
            //console.log(message);
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
        _addRawMessageListener();
        _addGlobalChannelJoinListener();
        _addGlobalChannelNamesListener();
        _pollUserStatus(60 * 1000);
        UserChannels.find({
            active: true, user: user.username,
            user_server_name: user_server.name}).forEach(function (channel) {
                _addChannelNamesListener(channel.name);
                _addChannelJoinListener(channel.name);
                _addChannelPartListener(channel.name);
                client.join(channel.name, function (message) {
                    Fiber(function (channel_name) {
                        _joinChannelCallback(message, channel);
                    }).run(channel.name);
                });
            });
        _.each(user_server.channels, function (channel_name) {
            
        });
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
                    });
                } else if (nick == 'ChanServ') {
                    try {
                        var channel_name = text.split(']')[0].substr(1);
                        var channel = UserChannels.findOne({
                            name: channel_name,
                            user_server_id: user_server._id,
                            user: user.username
                        });
                        if (channel)
                            UserChannelLogs.insert({
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
                            });
                    } catch (err) {
                    }
                }
            }).run();
        });
    }

    function _addCtcpListener () {
        if (LISTENERS.server['ctcp'] != 'undefined')
            return;
        LISTENERS.server['ctcp'] = '';
        client.addListener('ctcp', function (from, to, text, type) {
            Fiber(function () {
            }).run();
        });
    }

    function _partChannelCallback (message, channel_name) {
        Fiber(function() {
            var listeners = client.listeners('message' + channel_name);
            _.each(listeners, function (listener) {
                client.removeListener('message' + channel_name, listener);
            })
            UserChannels.update(
                {name: channel_name, user_server_id: user_server._id},
                {$set: {status: 'disconnected'}});
            for (job in JOBS) {
                if (job.search(channel_name) >= 0)
                    Meteor.clearInterval(JOBS[job]);
            }
        }).run();
    }

    function _partUserServerCallback (message, user_server, client) {
        Fiber(function () {
            UserServers.update(
                {_id: user_server._id},
                {$set: {status: 'disconnected'}}
            );
            UserChannels.update(
                {user_server_id: user_server._id},
                {$set: {status: 'disconnected'}}
            );
            UserChannels.find(
                {user_server_id: user_server._id}).forEach(function (channel) {
                    var key = user_server.name + '-' + channel.name;
                    if (WHO_DATA_POLL_LOCK[key] == user.username)
                        WHO_DATA_POLL_LOCK[key] = '';
                });
            for (job in JOBS) {
                Meteor.clearInterval(JOBS[job]);
                JOBS[job] = '';
            }
        }).run();
    }

    function _create_update_user_channel (user_server, channel_data) {
        var user_channel = UserChannels.findOne({name: channel_data.name,
            user_server_id: user_server._id, user: user.username});
        if (user_channel) {
            UserChannels.update({_id: user_channel._id},
                {$set: {
                    password: channel_data.password,
                    last_update: new Date(),
                    last_updater: user.username,
                    last_updater_id: user._id
                }
            });
            user_channel_id = user_channel._id;
        } else {
            var now = new Date();
            var user_channel_id = UserChannels.insert({
                name: channel_data.name,
                password: channel_data.password,
                user_server_id: user_server._id,
                user_server_name: user_server.name,
                user: user.username,
                user_id: user._id,
                creator: user.username,
                creator_id: user._id,
                created: now,
                last_updater: user.username,
                last_updater_id: user._id,
                last_updated: now
            });
        }
        var user_channel = UserChannels.findOne({_id: user_channel_id});
        return user_channel;
    }

    function _create_update_server_nick (info) {
        Fiber(function () {
            info['last_updated'] = new Date();
            info['server_name'] = user_server.name;
            info['server_id'] = user_server.server_id;
            // SmartCollections does not support 'upsert'
            //ServerNicks.upsert({
            //  server_name: user_server.name, nick: info.nick},
            //  {$set: info}
            //);
            var server_nick = ServerNicks.findOne({
              server_name: user_server.name, nick: info.nick});
            if (!server_nick) {
              info['created'] = info['last_updated'];
              ServerNicks.insert(info);
            } else
              ServerNicks.update({_id: server_nick._id},
                  {$set: info});
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
                    UserChannelLogs.insert({
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
                    });
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
                    });
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
                    });
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
                UserChannelLogs.insert({
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
                });
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
                });
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
                });
            }
        }).run();
    }

    return {
        joinChannel: function (channel_name, password) {
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
        },
        partChannel: function (channel_name) {
            var client = client_data[user_server.name];
            client.part(channel_name, function (message) {
                _partChannelCallback(
                    message, channel_name);
            });
        },
        create_update_user_channel: function (channel_data) {
            _create_update_user_channel(user_server, channel_data);
        },
        removeChannel: function (channel) {},
        joinUserServer: function () {
            var server = Servers.findOne({name: user_server.name});
            var server_url = server.connections[0].url;
            var server_port = server.connections[0].port || '6667';
            var nick = user_server.nick;
            var client_options = {
                autoConnect: false,
                port: '6697',
                userName: nick,
                realName: user_server.real_name || '~',
                secure: ssl_credentials,
                selfSigned: true,
                certExpired: true,
                debug: true
            }
            client = new irc.Client(server_url, nick, client_options);
            client_data[server.name] = client;
            UserServers.update({_id: user_server._id}, {$set: {
                status: 'connecting', active: true}
            });
            UserChannels.update(
                {user_server_id: user_server._id},
                {$set: {status: 'connecting'}}, {multi: true});
            if (LISTENERS.server['nickSet'] != undefined)
                return;
            LISTENERS.server['nickSet'] = '';
            client.addListener('nickSet', function (nick) {
                Fiber(function () {
                    if (user_server.current_nick != nick) {
                        UserServers.update({_id: user_server._id}, {$set: {current_nick: nick}});
                        user_server = UserServers.findOne({_id: user_server._id});
                    }
                }).run();
            });
            client.connect(function (message) {
                Fiber(function () {
                    _joinServerCallback(message);
                }).run();
            });
        },
        partUserServer: function () {
            var client = client_data[user_server.name];
            try {
                client.disconnect(function (message) {
                    _partUserServerCallback(message, user_server, client);
                });
            } catch (err) {

            }
        },
        addUserServer: function (server_data) {
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
        },
        markAway: function (message) {
            Fiber(function () {
                UserServers.update({_id: user_server._id}, {$set: {away_msg: message}});
                client.send('AWAY', message);
            }).run();
        },
        markActive: function () {
            client.send('AWAY', '');
        },
        removeServer: function (server_id, user_id) {},
        updateServer: function (server_id, server_data, user_id) {},
        sendChannelMessage: function (channel_name, message) {
            var channel = UserChannels.findOne({
              name: channel_name,
              user_server_id: user_server._id,
            }) || {};
            UserChannelLogs.insert({
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
            });
            client.say(channel_name, message);
        },
        changeNick: function (nick) {
            client.send('NICK', nick);
        },
        sendServerMessage: function (message) {
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
        },
        sendPMMessage: function (to, message) {
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
            });
            client.say(to, message);
        },
        getServerClient: function (server_id, user_id) {},
        isServerConnected: function (server_id) {},
        sendRawMessage: function (message, log_options) {
            var args = message.substr(1).split(' ');
            //console.log('############');
            //console.log(args);
            if (args[0] == 'whois' || args[0] == 'WHOIS') {
                client.whois(args[1], function (info) {
                    //console.log('+++++++WHOIS CALLBACK++++++++');
                    //console.log(info);
                    if (log_options.logInput) {
                        _logIncomingMessage(message, log_options);
                    }
                    _whois_callback(info, log_options);
                });
            } else 
            client.send.apply(client, args);
        }
    }
};
