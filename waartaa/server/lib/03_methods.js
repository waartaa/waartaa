function get_admin_users () {
    var user_ids = {};
    var admin_users = Meteor.users.find({is_admin: true});
    admin_users.forEach(function (user) {
        user_ids[user._id] = '';
    });
    return user_ids;
}

function make_user_admin (user) {
    Meteor.Users.update({_id: user._id}, {is_admin: true});
}

function validate_server_form_data(data, user, server) {
    if (user.admin !== true)
        throw new Meteor.Error(403,
            "You cannot add/update a global server.");
    else if (!data.name)
        throw new Meteor.Error(400, "Missing server name.");
    else if (! data.connections.length)
        throw new Meteor.Error(400, "Missing connections for server.");
    else if (Servers.findOne({name: data.name}))
        throw new Meteor.Error(403, "A server by this name already exists.");
}

function validate_user_server_form_data(data, user, server) {

}

function _create_update_server(server, data, user) {
    if (server) {
        Servers.update({_id: server._id}, {
            name: data.name, last_updater: user.username,
            last_updater_id: user._id, last_updated: new Date()
        });
    } else {
        var server_id = Servers.create({name: data.name, creator: user.username,
            creator_id: user._id, last_updater: user.username,
            last_updater_id: user._id, created: new Date(),
            last_updated: new Date})
        server = Servers.findOne({_id: server_id});
    }
    for (i in data.connections) {
        var conn_data = data.connections.i;
        var conn = null;
        if (conn_data.id) {
            conn = ServerConnections.findOne({server_id: server._id,
                _id: conn_data.id});
        }
        if (conn)
            ServerConnections.update({_id: conn._id}, {url: conn_data.url,
                port: conn_data.port, last_updater: user.username,
                last_updater_id: user._id, last_updated: new Date()});
        else
            ServerConnections.create({url: conn_data.url,
                port: conn_data.port, creator: user.username,
                creator_id: user._id, last_updater: user.username,
                last_updater_id: user._id, created: new Date(),
                last_updated: new Date()});
    }

}

function _create_update_user_server(server, data, user) {

}

function encrypt(text){
  var cipher = crypto.createCipher('aes-256-cbc', SECRET_KEY)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher('aes-256-cbc', SECRET_KEY)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function _create_user_server(data, user) {
    var server = Servers.findOne({_id: data.server_id});
    if (! server)
        throw new Meteor.Error(400, "Missing server info.");
    var user_server = UserServers.findOne({name: server.name});
    if (user_server)
        throw new Meteor.Error(400, "User server already exists.");
    else {
        var channels = [];
        var now = new Date();
        var splitted_channels = data.channels.split(',');
        for (i in splitted_channels) {
            var channel = splitted_channels[i];
            channels.push(channel.trim());
        }
        logger.info("CHANNELS: " + channels, "_create_user_server");
        var user_server_id = UserServers.insert({
            name: server.name,
            server_id: server._id,
            channels: channels,
            nick: data.nick,
            password: encrypt(data.password),
            user: user.username,
            user_id: user._id,
            created: now,
            creator: user.username,
            creator_id: user._id,
            last_updated: now,
            last_updater: user.username,
            last_updater_id: user._id
        })
    }
}

function getCurrentUser() {
    return Meteor.users.findOne({_id: this.userId});
}

function _join_user_server(user, user_server_name) {
    logger.debug(
        'User: ' + user.username + ' is joining server: ' +
        user_server_name, 'server.methods._join_user_server');
    var user_server = UserServers.findOne({
        user: user.username, name: user_server_name});
    if (user_server) {
        var irc_handler = IRCHandler(user, user_server);
        if (!CLIENTS[user.username]) {
            CLIENTS[user.username] = {};
        }
        CLIENTS[user.username][user_server_name] = irc_handler;
        irc_handler.joinUserServer();
    } else
        throw new Meteor.Error(404, "User server with name: "
            + user_server_name + " does not exist!");
}

Meteor.startup(function () {
    CLIENTS = {};
    console.log(Meteor.users.find());
    Meteor.users.find().forEach(function (user) {
        UserServers.find({user: user.username}).forEach(
            function (user_server) {
                _join_user_server(user, user_server.name);
            });
    });
});

Meteor.methods({
    // Create/update global servers (by admin users)
    server_create_update : function (data) {
        var user = Meteor.users.findOne({_id: this.userId});
        validate_server_form_data(data, user);
        var server = None;
        if (data.id)
            server = Servers.findOne({_id: data.id});
        _create_update_server(server, data, user);
    },
    // Create/update user servers
    user_server_create: function (data) {
        var user = Meteor.users.findOne({_id: this.userId});
        _create_user_server(data, user);
    },
    join_user_server: function (user_server_name) {
        var user = Meteor.users.findOne({_id: this.userId});
        _join_user_server(user, user_server_name);
        logger.dir(irc_handler,
            'Created IRCHandler instance for server: ' +
            user_server_name + ' user: ' + user.username,
            'server.methods.join_user_server');
    },
    join_user_channel: function (user_server_name, channel_name) {
        var user = Meteor.users.findOne({_id: this.userId});
        var irc_handler = CLIENTS[user.username][user_server_name];
        irc_handler.joinChannel(channel_name);
    },
    send_channel_message: function (user_channel_id, message) {
        var user_channel = UserChannels.findOne({
            _id: user_channel_id, user_id: this.userId});
        var user_server = UserServers.findOne({_id: user_channel.user_server_id});
        var user = Meteor.users.findOne({_id: this.userId});
        var irc_handler = CLIENTS[user.username][user_server.name];
        irc_handler.sendChannelMessage(user_channel.name, message);
    },
    change_nick: function (server_name, nick) {
        var user_server = UserServers.findOne({name: server_name, user_id: this.userId});
        var user = Meteor.users.findOne({_id: this.userId});
        var irc_handler = CLIENTS[user.username][user_server.name];
        logger.debug(
            "Changing nick from '" + irc_handler.client.nick + "' to '" +
                nick + "'.", "Methods.change_nick");
        irc_handler.changeNick(nick);
    },
    log_clients: function () {
        logger.dir(CLIENTS, "Log all clients", "Methods.log_clients");
    }
})
