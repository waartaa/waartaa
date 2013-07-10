IRCHandler = function () {
    var client_data = {};
    return {
        joinChannel: function (server_id, channel_name, user_id) {},
        partChannel: function (channel_id, user_id) {},
        joinSever: function (server_id, user_id) {},
        partServer: function (server_id, user_id) {},
        addServer: function (server_data, user_id) {}.
        removeServer: function (server_id, user_id) {},
        updateServer: function (server_id, server_data, user_id) {},
        sendChannelMessage: function (channel_id, message, user_id) {},
        sendServerMessage: function (server_id, message, user_id) {},
        sendPMMessage: function (server_id, to, message, user_id) {},
        getServerClient: function (server_id, user_id) {},
        isServerConnected: function (server_id) {},
    }
};