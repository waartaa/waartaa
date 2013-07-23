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
        return channel;
    }
    function _joinChannelCallback (message, channel_name) {
        console.log("Joined channel: " + channel_name);
        console.log(client);
        console.log(user_server);
        client.addListener('message' + channel_name, function (
                nick, text, message) {
            console.log(nick + "->" + channel_name + ': ' + text + '\n' + message);
        });
        Fiber(function () {
            var channel = getOrCreateUserChannel({name: channel_name});
            console.log(channel);
            client.addListener('names' + channel_name, function (nicks) {
                console.log(nicks);
                Fiber(function () {
                    UserChannels.update({_id: channel._id}, {
                        $set: {
                            nicks: nicks
                        }
                    });
                }).run();
            });

            client.addListener('message' + channel_name,
                    function (nick, text, message) {
                console.log(user_server + "/" + channel.name + ": " + nick + '->' + text);
                Fiber(function () {
                    UserChannelLogs.insert({
                        message: text,
                        raw_message: message,
                        from: nick,
                        from_user: null,
                        from_user_id: null,
                        channel_name: channel_name,
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

    function _joinServerCallback (message) {
        console.log("Joined server: " + message);
        console.log(user_server);
        UserServers.update({_id: user_server._id}, {$set: {
            status: 'connected'}
        });
        _.each(user_server.channels, function (channel) {
            client.join(channel, function (message) {
                Fiber(function () {
                    _joinChannelCallback(message, channel);
                }).run();
            });
        });
        client.addListener('notice', function (nick, to, text, message) {
            if (nick == null) {
                // NOTICE from server
            }
        });
        client.addListener('error', function (err) {
            console.log(err);
        });
    }

    function _partChannelCallback (message, channel, user_server, client) {
        console.log("Parted channel: " + user_server.name + ":" + channel);
        console.log("Channel part message: " + message);
    }

    function _partUserServerCallback (message, user_server, client) {

    }
    function _create_update_user_server (user_server, channel_data) {
        var user_channel = UserChanels.findOne({name: channel_data.name,
            user_server_id: user_server._id});
        if (user_channel) {
            UserChannel.update({_id: user_channel._id},
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
            var user_channel_id = UserChannel.insert({
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
        var user_channel = UserChannels.get({_id: user_channel_id});
        return user_channel;
    }

    return {
        joinChannel: function (channel_name) {
            console.log(client);
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
            _create_update_user_server(user_server, channel_data);
        },
        removeChannel: function (channel) {},
        joinUserServer: function () {
            var server = Servers.findOne({name: user_server.name});
            console.log(server.connections);
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
            _.each(server_data.channels, function (item) {
                create_update_user_channel(user_server, item);
            });
        },
        removeServer: function (server_id, user_id) {},
        updateServer: function (server_id, server_data, user_id) {},
        sendChannelMessage: function (channel_name, message) {
            client.say(channel_name, message);
        },
        changeNick: function (nick) {
            client.send('NICK', nick);
        },
        sendServerMessage: function (server_id, message, user_id) {},
        sendPMMessage: function (server_id, to, message, user_id) {},
        getServerClient: function (server_id, user_id) {},
        isServerConnected: function (server_id) {},
    }
};
