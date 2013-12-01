IRCHandler = function (user, user_server) {
    var client_data = {};
    var client = null;
    var user_status = "";
    var channels_listening_to = {};

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
            UserChannels.update({_id: channel._id}, {$set: {status: 'connected'}});
            if (channels_listening_to[channel.name])
                return;
            client.addListener('message' + channel.name,
                    function (nick, text, message) {
                Fiber(function () {
                    if (user.username == 'rtnpro') {
                        console.log('Adding channel message listener:');
                        console.log(channel.name);
                    }
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
        ChannelNicks.find(
            {channel_name: channel_name,
             server_name: user_server.name},
            {nick: 1}
        ).forEach(function (channel_nick) {
            if (!nicks[channel_nick.nick]) {
                ChannelNicks.remove(
                    {
                        channel_name: channel_name,
                        server_name: user_server.name,
                        nick: channel_nick.nick
                    });
            } else {
                delete nicks[channel_nick.nick];
            }
        });
        for (nick in nicks) {
            ChannelNicks.insert({
                channel_name: channel_name,
                server_name: user_server.name,
                nick: nick
            });
        }
    }

    function _addChannelNamesListener (channel_name) {
        client.addListener('names' + channel_name, function (nicks) {
            Fiber(function () {
                _updateChannelNicks(channel_name, nicks);
            }).run();
        });
    }

    function _addGlobalChannelNamesListener () {
        client.addListener('names', function (channel, nicks) {
                //console.log("++++++++++++++GLOBAL CHANNEL NAMES LISTENER: " + channel + ' ' + user.username + ' ' + user_server.name);
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
      return whoisInfo;
    }

    function _update_channel_nicks_from_who_data (message) {
      _updateChannelNicks(message.channel, message.nicks);
    }

    function _addWhoListener () {
      //console.log('log WHO data');
      client.addListener('who', function (message) {
        //console.log(message);
        if (message) {
            Fiber(function () {
              for (nick in message.nicks) {
                var who_info = message.nicks[nick];
                var whoisInfo = whoToWhoisInfo(nick, who_info);
                _create_update_server_nick(whoisInfo);
              }
            }).run();
        }
      });
    }

    function _getChannelWHOData (channel_name) {
        client.send('who', channel_name);
    }

    function _addChannelJoinListener (channel_name) {
        client.addListener('join' + channel_name, function (nick, message) {
            Fiber(function () {
                setInterval(_getChannelWHOData, CONFIG.channel_who_poll_interval, channel_name);                var channel = UserChannels.findOne({name: channel_name, user: user.username});
                if (channel) {
                    var nicks = channel.nicks || {};
                    nicks[nick] = '';
                    UserChannels.update({_id: channel._id}, {
                        $set: {
                            nicks: nicks
                        }
                    });
                }
            }).run();
        });
    }

    function _addGlobalChannelJoinListener () {
        client.addListener('join', function (channel, nick, message) {
            //console.log('======' + channel + ' ' + nick + ' ' + message);
            Fiber(function () {
                var user_channel = _create_update_user_channel(
                    user_server, {name: channel});
                //console.log(user_channel);
                UserChannels.update(
                    {_id: user_channel._id}, {$set: {active: true}}, {  multi: true});
                _addChannelJoinListener(channel.name);
                _addChannelPartListener(channel.name);
                _joinChannelCallback(message, channel);
            }).run();
        });
    }

    function _addChannelPartListener (channel_name) {
        client.addListener('part' + channel_name, function (nick, reason, message) {
            Fiber(function () {
                ChannelNicks.remove(
                  {
                    channel_name: channel_name, server_name: user_server.name,
                    nick: nick
                  }
                );
                if (channels_listening_to[channel_name])
                    delete channels_listening_to[channel_name];
            }).run();
        });
    }

    function _addServerQuitListener () {
        client.addListener('quit', function (nick, reason, channels, message) {
            Fiber(function () {
                _.each(channels, function (channel_name) {
                    var channel = UserChannels.findOne({
                        name: channel_name, user_server_id: user_server._id,
                        user: user.username
                    });
                    if (channel) {
                        var nicks = channel.nicks;
                        try {
                            delete nicks[nick];
                        } catch (err) {}
                        UserChannels.update({_id: channel._id}, {
                            $set: {nicks: nicks}
                        });
                    }
                });
                channels_listening_to = {};
            }).run();
        });
    }

    function _addChannelTopicListener () {
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
        Meteor.setInterval(function () {
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
                //_addChannelNamesListener(channel.name);
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
        client.addListener('ctcp', function (from, to, text, type) {
            Fiber(function () {
            }).run();
        });
    }

    function _partChannelCallback (message, channel_name) {
        Fiber(function() {
            UserChannels.update(
                {name: channel_name, user_server_id: user_server._id},
                {$set: {status: 'disconnected'}});
        }).run();
    }

    function _partUserServerCallback (message, user_server, client) {

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
            if (password) {
                client.send('JOIN', channel_name, password);
            } else {
                client.join(channel_name, function (message) {
                    Fiber(function () {
                        var channel = UserChannels.findOne({
                            name: channel_name, user_server_name: user_server.name,
                            user: user.username
                        })
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
                status: 'connecting'}
            });
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
