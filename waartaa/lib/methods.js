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
        console.log(channels);
        var user_server_id = UserServers.insert({
            name: server.name,
            server_id: server._id,
            channels: channels,
            nick: data.nick,
            password: data.password,
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
    }
})