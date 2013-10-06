IRCHandler = function (user, user_server) {
    var client_data = {};
    var client = null;

    /* Event listener callbacks */
    /* Callbacks */
    function getOrCreateUserChannel(channel_data) {
        var channel = UserChannels.findOne({
            user_server_id: user_server._id, name: channel_data.name});
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
            });
            var channel = UserChannels.findOne({_id: user_channel_id});
        }
        logger.dir(channel_data, 'user: ' + user.username + ' server: ' +
            user_server.name, 'getOrCreateUserChannel');
        return channel;
    }
    function _joinChannelCallback (message, channel) {
        Fiber(function () {
            logger.debug(
                "JoinChannelCallback - " + user_server.name + ":" + channel.name
            );
            UserChannels.update({_id: channel._id}, {$set: {status: 'connected'}});
            client.addListener('message' + channel.name,
                    function (nick, text, message) {
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

    function _addChannelNamesListener (channel_name) {
        client.addListener('names' + channel_name, function (nicks) {
            Fiber(function () {
                logger.dir(
                    nicks, 'Nicks in channel: ' + channel_name +
                    ' in server: ' + user_server.name, 'ChannelNames');
                var channel = UserChannels.findOne({
                  name: channel_name, user_server_id: user_server._id});
                if (channel)
                  UserChannels.update({_id: channel._id}, {
                      $set: {
                          nicks: nicks
                      }
                  });
            }).run();
        });
    }

    function _addGlobalChannelNamesListener () {
        client.addListener('names', function (channel, nicks) {
                console.log("++++++++++++++GLOBAL CHANNEL NAMES LISTENER: " + channel);
                console.log(nicks);
            Fiber(function () {
                console.log(nicks);
                var user_channel = UserChannels.findOne({
                    name: channel, active: true});
                console.log(user_channel.name);
                if (user_channel) {
                    UserChannels.update(
                        {_id: user_channel._id},
                        {$set: {nicks: nicks}}
                    );
                }
            }).run();
        });
    }

    function _addChannelJoinListener (channel_name) {
        client.addListener('join' + channel_name, function (nick, message) {
            Fiber(function () {
                logger.dir(
                    message, 'Nick: ' + nick + ' joined channel: ' +
                    channel_name + ' in server: ' + user_server.name +
                    ' for user: ' + user.username + '.', 'ChannelJoin'
                );
                var channel = UserChannels.findOne({name: channel_name});
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
            console.log('======' + channel + ' ' + nick + ' ' + message);
            Fiber(function () {
                var user_channel = _create_update_user_channel(
                    user_server, {name: channel});
                UserChannels.update(
                    {_id: user_channel._id}, {$set: {active: true}}, {  multi: true});
            }).run();
        });
    }

    function _addChannelPartListener (channel_name) {
        client.addListener('part' + channel_name, function (nick, reason, message) {
            Fiber(function () {
                logger.dir(
                    message, 'Nick: ' + nick + ' left channel: ' +
                    channel_name + ' in server: ' + user_server.name +
                    ' due to reason: ' + reason + ' for user: ' +
                    user.username + '.', 'ChannelPart'
                );
                var channel = UserChannels.findOne({name: channel_name});
                if (channel) {
                    var nicks = channel.nicks || {};
                    try {
                        delete nicks[nick];
                    } catch (err) {}
                    UserChannels.update({_id: channel._id}, {
                        $set: {
                            nicks: nicks
                        }
                    });
                }
            }).run();
        });
    }

    function _addServerQuitListener () {
        client.addListener('quit', function (nick, reason, channels, message) {
            Fiber(function () {
                logger.dir(
                    message, 'Nick: ' + nick + ' quit server: ' +
                    user_server.name + ' due to reason: ' + reason +
                    ' for user: ' + user.username + '.', 'ServerQuit'
                );
                _.each(channels, function (channel_name) {
                    var channel = UserChannels.findOne({
                        name: channel_name, user_server_id: user_server._id,
                        user: user.username
                    });
                    if (channel) {
                        var nicks = channel.nicks;
                        delete nicks[nick];
                        UserChannels.update({_id: channel._id}, {
                            $set: {nicks: nicks}
                        });
                    }
                });
            }).run();
        });
    }

    function _addChannelTopicListener () {
        client.addListener('topic', function (channel, topic, nick, message) {
            Fiber(function () {
                logger.debug('Nick: ' + nick + ' set topic for channel: ' +
                    channel + ' in server: ' + user_server.name + ' as:' + topic,
                    '@' + user.username + ':ChannelTopic');
                UserChannels.update({
                    name: channel, user_server_id: user_server._id,
                    user: user.username
                }, {$set: {topic: topic}});
            }).run();
        });
    }

    function _addSelfMessageListener (argument) {
        client.addListener('selfMessageSent', function (target, message) {
            logger.debug(
                "MessageSent: " + "target: " + target + " message: " + message,
                "MessageSent@" + user.username);
        })
    }

    function _addWhoisListener (info) {
        logger.dir(info, 'WHOIS', 'WHOIS@' + username);
    }

    function _addPMListener () {
        client.addListener('message', function (nick, to, text, message) {
            console.log(nick + ', ' + to + ', ' + text + ', ' + message);
            Fiber(function () {
                if (to == client.nick) {
                    logger.debug(nick + ' ' + JSON.stringify(user.profile.connections[user_server._id].pms));
                    var profile = user.profile;
                    profile.connections[user_server._id].pms[nick] = "";
                    Meteor.users.update({_id: user._id}, {$set: {profile: profile}});
                    var from_user = Meteor.users.findOne({username: nick}) || {};
                    var to_user = user;
                    PMLogs.insert({
                        message: text,
                        raw_message: message,
                        from: nick,
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
            console.log(message);
        });
    }

    function _joinServerCallback (message) {
        UserServers.update({_id: user_server._id}, {$set: {
            status: 'connected'}
        });
        _addServerQuitListener();
        _addChannelTopicListener();
        _addNoticeListener();
        _addCtcpListener();
        _addSelfMessageListener();
        _addPMListener();
        _addRawMessageListener();
        _addGlobalChannelJoinListener();
        _addGlobalChannelNamesListener();
        UserChannels.find({
            active: true, user: user.username,
            user_server_name: user_server.name}).forEach(function (channel) {
                //_addChannelNamesListener(channel.name);
                _addChannelJoinListener(channel.name);
                _addChannelPartListener(channel.name);
                client.join(channel.name, function (message) {
                    Fiber(function (channel_name) {
                        _joinChannelCallback(message, channel_name);
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
                logger.trace(err, '', '02_irc.js');
            }).run();
        });
    }

    function _addNoticeListener () {
        client.addListener('notice', function (nick, to, text, message) {
            Fiber(function () {
                logger.dir(
                    message,
                    'nick: ' + nick + ' to: ' + to + ' text: ' + text,
                    'Notice@' + user.username);
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
                        logger.trace(
                            err,
                            "Error during logging ChanServ message",
                            "NoticeError@" + user.username);
                    }
                }
            }).run();
        });
    }

    function _addCtcpListener () {
        client.addListener('ctcp', function (from, to, text, type) {
            Fiber(function () {
                logger.debug(
                    'from: ' + from + ' to: ' + to + ' text: ' + text +
                    ' type: ' + type,
                    'CTCP@rtnpro'
                );
            }).run();
        });
    }

    function _partChannelCallback (message, channel, user_server, client) {
        Fiber(function() {
            logger.debug("PartChannelCallback - " + user_server + ":" + channel);
            UserChannels.update({_id: channel._id}, {$set: {active: false, status: 'disconnected'}});
        }).run();
    }

    function _partUserServerCallback (message, user_server, client) {

    }

    function _create_update_user_channel (user_server, channel_data) {
        var user_channel = UserChannels.findOne({name: channel_data.name,
            user_server_id: user_server._id});
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
                creator: user.username,
                creator_id: user._id,
                created: now,
                last_updater: user.username,
                last_updater_id: user_id,
                last_updated: now
            });
        }
        var user_channel = UserChannels.findOne({_id: user_channel_id});
        return user_channel;
    }

    return {
        joinChannel: function (channel_name) {
            client.join(channel_name, function (message) {
                _joinChannelCallback(message, channel_name);
            });
        },
        partChannel: function (channel_name) {
            var client = client_data[user_server.name];
            client.part(channel_name, function (message) {
                _partChannelCallback(
                    message, channel_name, user_server, client);
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
                port: server_port
            }
            client = new irc.Client(server_url, nick, client_options);
            client_data[server.name] = client;
            UserServers.update({_id: user_server._id}, {$set: {
                status: 'connecting'}
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
            logger.dir(user_server, 'Added user server', 'irc.IRCHandler.addUserServer');
            _.each(server_data.channels, function (item) {
                create_update_user_channel(user_server, item);
            });
        },
        markAway: function (message) {},
        markActve: function () {},
        removeServer: function (server_id, user_id) {},
        updateServer: function (server_id, server_data, user_id) {},
        sendChannelMessage: function (channel_name, message) {
            client.say(channel_name, message);
        },
        changeNick: function (nick) {
            client.send('NICK', nick);
        },
        sendServerMessage: function (server_id, message, user_id) {},
        sendPMMessage: function (to, message) {
            client.say(to, message);
        },
        getServerClient: function (server_id, user_id) {},
        isServerConnected: function (server_id) {},
        sendRawMessage: function (message) {
            var args = message.substr(1).split(' ');
            client.send.apply(client, args);
        }
    }
};
