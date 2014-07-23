IRC_NICK_REGEX = /^[A-Za-z_\-\[\]\\^{}|`][\w\-\[\]\\^{}|`]{2,15}$/;

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
  var server = Servers.findOne({_id: data.server_id});
  if ( !server )
    throw new Meteor.Error(404, {
      field: 'server',
      message: "Server not found"});
  else if ( !data.nick.match(IRC_NICK_REGEX)
      || data.nick.toLowerCase() == server.name.toLowerCase())
    throw new Meteor.Error(400, {
      field: 'nick',
      message: "Invalid nick"});
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
  if (text.length > 0) {
    var cipher = crypto.createCipher('aes-256-cbc', SECRET_KEY)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
  }
  return '';
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
  if (data.user_server_id) {
    var user_server = UserServers.findOne(
      {_id: data.user_server_id});
  }
  else {
    var user_server = UserServers.findOne(
      {name: server.name, user: user.username});
  }
  var channels = [];
  var now = new Date();
  var splitted_channels = data.channels.split(',');
  for (i in splitted_channels) {
    var channel = splitted_channels[i];
    if (channel.trim())
      channels.push(channel.trim());
  }
  user_server_data = {
    channels: channels,
    nick: data.nick,
    real_name: data.real_name,
    active: true,
    //password: encrypt(data.password),
    user: user.username,
    user_id: user._id,
    created: now,
    creator: user.username,
    creator_id: user._id,
    last_updated: now,
    last_updater: user.username,
    last_updater_id: user._id
  };
  if (user_server) {
    //var password = data.password;
    //if (data.password != user_server.password)
    //  password: user_server_data.password;
    UserServers.update({_id: user_server._id}, {
      $set: {
        nick: data.nick,
        //password: password,
        real_name: data.real_name,
        channels: user_server_data.channels,
        last_updated: user_server_data.last_updated,
        last_updater: user_server_data.last_updater,
        last_updater_id: user_server_data.last_updater_id,
        active: user_server_data.active
      }
    });
    var user_server = UserServers.findOne({_id: user_server._id});
  } else {
    user_server_data["name"] = server.name;
    user_server_data["server_id"] = server._id;
    var user_server_id = UserServers.insert(user_server_data);
    var user_server = UserServers.findOne({_id: user_server_id});
  }
  for (i in user_server.channels) {
    var channel_name = user_server.channels[i];
    var channel = UserChannels.findOne(
      {name: channel_name, user_server_id: user_server._id});
    if (! channel) {
      var channel_id = UserChannels.insert({
        name: channel_name,
        user_server_id: user_server._id,
        user_server_name: user_server.name,
        user_id: this.userId,
        user: user.username,
        creator: user.username,
        creator_id: user._id,
        created: Date(),
        last_updater: user.username,
        last_updater_id: user._id,
        last_updated: Date(),
        active: true
      })
    }
  }
  UserChannels.update(
    {
      name: {$in: user_server.channels}, user: user.username,
      user_server_name: user_server.name
    },
    {$set: {active: true}}, {multi: true}
  );
  UserChannels.update(
    {
      name: {$nin: user_server.channels}, user: user.username,
      user_server_name: user_server.name
    },
    {$set: {active: false}}, {multi: true}
  );
  /*for (i in user_server.channels) {
    var channel_name = user_server.channels[i];
    Meteor.call('join_user_channel', user_server.name, channel_name);
  }*/
  _join_user_server(user, user_server.name);
}

function getCurrentUser() {
  return Meteor.users.findOne({_id: this.userId});
}

function _join_user_server(user, user_server_name) {
  var user_server = UserServers.findOne({
    user: user.username, name: user_server_name});
  var irc_handler = (CLIENTS[user.username] || {})[user_server_name];
  if (user_server) {
    if ( !irc_handler ) {
      irc_handler = IRCHandler(user, user_server);
      if (!CLIENTS[user.username]) {
        CLIENTS[user.username] = {};
      }
      CLIENTS[user.username][user_server_name] = irc_handler;
    }
    irc_handler.joinUserServer();
  } else
    throw new Meteor.Error(404, "User server with name: "
      + user_server_name + " does not exist!");
}

function _get_irc_handler (user_server_name, user_id) {
  try {
    var user = Meteor.users.findOne({_id: user_id});
    var user_server = UserServers.findOne({
      name: user_server_name, user: user.username});
    return CLIENTS[user.username][user_server.name];
  } catch (err) {
    return {};
  }
}

function _send_raw_message(message, irc_handler, log_options) {
  irc_handler.sendRawMessage(message, log_options);
}

_send_channel_message = function (user, user_channel_id, message, log_options) {
  var user_channel = UserChannels.findOne({
    _id: user_channel_id, user: user.username});
  var irc_handler = _get_irc_handler(
    user_channel.user_server_name, user._id);
  if (!irc_handler)
    return false;
  var logged = true;
  var send = true;
  var action = false;
  log_options = log_options || {};
  if (typeof(log_options.log) == 'undefined')
    log_options.log = true;
  if (message[0] == '/') {
    logged = false;
    log_options.target = user_channel.name;
    _send_raw_message(message, irc_handler, log_options);
    if (message.search('/msg') == 0)
      return false;
    if (message.search('/me') == 0)
      action = true;
    send = false;
  }
  irc_handler.sendChannelMessage(
    user_channel.name, message, action, send, log_options.log);
  return logged;
};


Meteor.startup(function () {
  CLIENTS = {};
  SERVER_JOIN_QUEUE = new PowerQueue({
    name: "join_server",
    debug: CONFIG.QUEUE_DEBUG || false,
    maxProcessing: 1
  });
  CHANNEL_JOIN_QUEUE = new PowerQueue({
    name: "join_channel",
    debug: CONFIG.QUEUE_DEBUG || false,
    maxProcessing: 1
  });
  URGENT_QUEUE = new PowerQueue({
    name: "urgent",
    debug: CONFIG.QUEUE_DEBUG || false,
    maxProcessing: CONFIG.URGENT_QUEUE_WORKERS_COUNT || 1
  });
  DELAYED_QUEUE = new PowerQueue({
    name: "delayed",
    debug: CONFIG.QUEUE_DEBUG || false,
    maxProcessing: CONFIG.DELAYED_QUEUE_WORKERS_COUNT || 1
  });
  // Reload server config
  Servers.find({}).forEach(function (server) {
    if (!GlobalServers[server.name])
      return;
    Servers.update({_id: server._id}, {$set: GlobalServers[server.name]});
  });
  Meteor.users.find({}).forEach(function (user) {
    UserServers.find(
      {
        user: user.username, active: true,
        status: {$nin: ['user_disconnected', 'admin_disconnected']}
      }
    ).forEach(function (user_server) {
      _join_user_server(user, user_server.name);
    });
  });
});

Meteor.methods({
  // Create/update global servers (by admin users)
  server_create_update : function (data) {
    var user = Meteor.users.findOne({_id: this.userId});
    var server = Servers.findOne({_id: data.id});
    validate_server_form_data(data, user, server);
    _create_update_server(server, data, user);
  },
  // Create/update user servers
  user_server_create: function (data) {
    var user = Meteor.users.findOne({_id: this.userId});
    validate_user_server_form_data(data, user);
    _create_user_server(data, user);
  },
  join_user_server: function (user_server_name) {
    var user = Meteor.users.findOne({_id: this.userId});
    UserServers.update(
      {
        name: user_server_name,
        user: user.username,
        status: 'user_disconnected'
      },
      {$set: {status: 'disconnected'}},
      {multi: true}
    );
    _join_user_server(user, user_server_name);
  },
  quit_user_server: function (user_server_name, close) {
    var irc_handler = _get_irc_handler(user_server_name, this.userId);
    if (irc_handler) {
      var user = Meteor.users.findOne({_id: this.userId});
      var active = close? false: true;
      UserServers.update(
        {
          user: user.username, name: user_server_name,
        }, {$set: {active: active, status: 'disconnecting'}}, {multi: true});
      irc_handler.partUserServer();
    }
  },
  join_user_channel: function (user_server_name, channel_names) {
    var user = Meteor.users.findOne({_id: this.userId});
    var user_server = UserServers.findOne(
      {name: user_server_name, user: user.username});
    if (!user_server)
      return;
    var irc_handler = _get_irc_handler(user_server.name, this.userId);
    if (!irc_handler)
      return;
    _.each(channel_names.split(','), function (channel_name) {
      channel_name = channel_name.trim();
      if (channel_name) {
        UserChannels.update(
          {
            user: user.username, user_server_name: user_server_name,
            name: channel_name, user_server_id: user_server._id,
          },
          {
            $set: {active: true, status: 'connecting'}
          },
          {multi: true, upsert: true}
        );
        Fiber(function () {
          irc_handler.joinChannel(channel_name)
        }).run();
        Meteor.setTimeout(function() {
          Fiber(function () {
            UserChannels.update(
              {
                user: user.username,
                user_server_name: user_server.name,
                name: channel_name,
                active: true,
                status: 'connecting'
              },
              {$set: {status: 'disconnected'}},
              {multi: true}
            );
          }).run();
        }, 30 * 1000);
      }
    });
  },
  part_user_channel: function (user_server_name, channel_name, close) {
    var user = Meteor.users.findOne({_id: this.userId});
    var irc_handler = CLIENTS[user.username][user_server_name];
    var active = close? false: true;
    UserChannels.update(
      {
        user: user.username, name: channel_name,
        user_server_name: user_server_name
      }, {$set: {active: active, status: 'disconnecting'}}, {multi: true});
    if (irc_handler)
      irc_handler.partChannel(channel_name);

  },
  send_channel_message: function (user_channel_id, message, log_options) {
    var user = Meteor.users.findOne({_id: this.userId});
    _send_channel_message(user, user_channel_id, message, log_options);
  },
  send_server_message: function (user_server_id, message, log_options) {
    var user_server = UserServers.findOne(
      {_id: user_server_id, user_id: this.userId}, {name: 1});
    var irc_handler = _get_irc_handler(user_server.name, this.userId);
    if (message[0] == '/') {
      if (message.search('/me') == 0)
        return;
      _send_raw_message(message, irc_handler, log_options);
      return;
    }
    if (irc_handler)
      irc_handler.sendServerMessage(message);
  },
  change_nick: function (server_name, nick) {
    var user_server = UserServers.findOne({name: server_name, user_id: this.userId});
    var user = Meteor.users.findOne({_id: this.userId});
    var irc_handler = CLIENTS[user.username][user_server.name];
    if (irc_handler)
      irc_handler.changeNick(nick);
  },
  log_clients: function () {
    logger.debug('ircClient: %s', CLIENTS);
  },
  toggle_pm: function (user_server_id, nick, action) {
    var user = Meteor.users.findOne({_id: this.userId});
    if (!user)
      return;
    var user_server = UserServers.findOne(
      {_id: user_server_id, user: user.username});
    if (!user_server)
      return;
    var pms = {};
    var userPm = UserPms.findOne(
      {user: user.username, user_server_name: user_server.name});
    if (userPm)
      pms = userPm.pms;
    if (action == 'create')
      pms[nick] = '';
    else if (action == 'delete') {
      try {
        delete pms[nick];
      } catch (err) {}
    }
    UserPms.update(
      {
      user_id: user._id,
      user_server_id: user_server._id,
      user_server_name: user_server.name,
      user: user.username
      },
      {$set: {pms: pms}},
      {upsert: true}
    );
  },
  send_pm: function (message, room_id, log_options) {
    var user_server_id = room_id.split('_')[0];
    var nick = room_id.slice(room_id.search('_') + 1);
    var user = Meteor.users.findOne({_id: this.userId});
    var user_server = UserServers.findOne({
      _id: user_server_id, user: user.username});
    var irc_handler = (CLIENTS[user.username] || {})[user_server.name];
    if (!irc_handler)
      return;
    var send = true;
    var action = false;
    if (message[0] == '/') {
      log_options = log_options || {};
      log_options.target = nick;
      _send_raw_message(message, irc_handler, log_options);
      if (message.search('/msg') == 0)
        return;
      if (message.search('/me') == 0)
        action = true;
      send = false
    }
    irc_handler.sendPMMessage(nick, message, action, send);
  },
  mark_away: function (user_server_name, away_message) {
    var irc_handler = _get_irc_handler(user_server_name, this.userId);
    if (irc_handler)
      irc_handler.markAway(away_message);
  },
  mark_active: function (user_server_name) {
    var irc_handler = _get_irc_handler(user_server_name, this.userId);
    if (irc_handler)
      irc_handler.markActive();
  },
  send_command: function (user_server_name, command_str, log_options) {
    var irc_handler = _get_irc_handler(user_server_name, this.userId);
    if (irc_handler)
      _send_raw_message(command_str, irc_handler, log_options);
  },
  whois: function (user_server_name, nick, log_options) {
    if (log_options) {
      var roomtype = log_options.roomtype;
      var room_id = log_options.room_id;
      if (roomtype == "channel") {

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
          type: 'cmd'
        });


      } else if (roomtype == "pm") {

      } else if (roomtype == "server") {

      }
    }
    var irc_handler = _get_irc_handler(user_server_name, this.userId);
    if (irc_handler)
      _send_raw_message(command_str, irc_handler);
  },
  edit_user_channel: function (user_channel_id, data) {
    UserChannels.update({_id: user_channel_id}, {
      $set: {password: data.password || ''}});
  },
  //get server time in milliseconds
  getServerMS: function () {
    var _time = (new Date).getTime();
    return _time;
  },
  // Send Verification Email
  change_email: function(userId, email) {
    Accounts.sendVerificationEmail(userId, email);
  },
})
