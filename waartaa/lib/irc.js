IRCHandler = function () {
    var client_data = {};
    return {
        joinChannel: function (server_id, channel_name, user_id) {},
        partChannel: function (channel_id, user_id) {},
        joinSever: function (server_id, user_id) {},
        partServer: function (server_id, user_id) {},
        addUserServer: function (server_data, user) {
            var now = new Date();
            return UserServers.insert({
                name: server_data.server.name,
                server_id: server_data.server._id,
                nick: server_data.nick,
                password: server_data.password,
                channels: server_data.channels,
                user: user,
                user_id: user._id,
                created: now,
                creator: user,
                creator_id: user._id,
                last_updated: now,
                last_updater: user,
                last_updater_id: user._id,
            })
        },
        removeServer: function (server_id, user_id) {},
        updateServer: function (server_id, server_data, user_id) {},
        sendChannelMessage: function (channel_id, message, user_id) {},
        sendServerMessage: function (server_id, message, user_id) {},
        sendPMMessage: function (server_id, to, message, user_id) {},
        getServerClient: function (server_id, user_id) {},
        isServerConnected: function (server_id) {},
    }
};