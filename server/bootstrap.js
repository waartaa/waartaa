if (typeof(Clients) == "undefined")
  Clients = {};

reloadUserProfiles = function (users) {
  if (!users) {
    var users = Meteor.users.find().fetch();
  }
  for (var i=0; i < users.length; i++) {
    var user = users[i];
    var user_profile = user_profiles[user.username];
    for (i in user_profile.connections) {
      var server = user_profile.connections[i];
      var serverObj = Servers.findOne({name: server.name});
      if (! serverObj) {
        var server_id = Servers.insert({
          name: server.name, password: server.password,
          connections: server.servers,
        })
        serverObj = Servers.findOne({id: server_id});
      }
      for (j in server.channels) {
        if (!Channels.findOne({server_id: serverObj._id, name: server.channels[j]})) {
          Channels.insert({
            name: server.channels[j],
            server_id: serverObj._id,
            server_name: serverObj.name});
        }
      }
    }
    if (user_profile) {
      Meteor.users.update({_id: user._id}, {$set: {profile: user_profile}});
    }
  }
  return users;
}

initializeClients = function() {
  var users = Meteor.users.find().fetch();
  users = reloadUserProfiles(users);
  for (var i=0; i < users.length; i++) {
    var user = users[i];
    var connections_updated = false;
    var profile = user.profile;
    var connections = profile.connections;
    var user = users[i];
    var client_server_dict = Clients[user.username] || {};
    for (var j=0; j < connections.length; j++) {
      var conn = connections[j];
      if (!Clients[user.username]) {
        connections_updated = true;
          var client = new irc.Client(conn.servers[0], user.username, {
            channels: conn.channels
          });
          client.addListener('error', function (err) {
            console.log(err);
          });
          client.addListener('message#', function(nick, to, text, message) {
            Fiber(function(){
              var channel = Channels.findOne({name: to, server_name: conn.name});
              var log_id = ChannelLogs.insert({
                from: nick,
                from_user_id: null,
                message: text,
                channel_name: to,
                channel_id: channel._id
              });
            }).run();
          });
          client.addListener('names', function(channel, nicks) {
            console.log('###############################');
            console.log(nicks);
            Fiber(function () {
              Channels.update({name: channel, server_name: conn.name}, {$set: {nicks: nicks}});
            }).run();
          });
          client.addListener('join', function(channel, nick, message) {
            Fiber(function (data) {
              var channel = data.channel;
              var nick = data.nick;
              var message = data.message;
              console.log([channel, nick, message]);
              var query = {name: channel, server_name: conn.name};
              console.log(query);
              var channel = Channels.findOne(query);
              if (!channel) return;
              var nicks = channel.nicks;
              nicks[nick] = '';
              Channels.update({_id: channel._id}, {$set: {nicks: nicks}});
            }).run({channel: channel, nick: nick, message: message});
          });
          client.addListener('part', function(channel, nick, reason, message) {
            Fiber(function(data) {
              var channel = data.channel;
              var nick = data.nick;
              var reason = data.reason;
              var message = data.message;
              var query = {name: channel, server_name: conn.name};
              console.log(query);
              var channelObj = Channels.findOne(query);
              console.log([channelObj]);
              if (!channelObj) return;
              var nicks = channelObj.nicks;
              delete nicks[nick];
              Channels.update({_id: channelObj._id}, {$set: {nicks: nicks}});
            }).run({
              channel: channel,
              nick: nick,
              reason: reason,
              message: message
            });
          });
          client.addListener('quit', function(nick, reason, channels, message) {
            Fiber(function (data) {
              var nick = data.nick;
              var reason = data.reason;
              var channels = data.channels;
              var message = data.message;
              var channelObjs = Channels.find({name: {$in: channels}, server_name: conn.name});
              channelObjs.forEach(function (channel) {
                console.log(channel);
                var nicks = channel.nicks;
                delete nicks[nick];
                Channels.update({_id: channel._id}, {$set: {nicks: nicks}});
              });
            }).run({
              nick: nick,
              reason: reason,
              channels: channels,
              message: message
            });
          });
          client_server_dict[conn.name] = client;
      }
    }
    if (connections_updated) {
      Clients[user.username] = client_server_dict;
    }
  }
}

Meteor.startup(function () {
  if (Servers.find().count() === 0) {
    var connections = [
      {
          name: 'Freenode',
          servers: ['irc.freenode.net'],
          password: null,
          nicks: ['rtnpro', 'rtnpro_', 'rtnpro__'],
          channels: ['#dgplug', '#bcrec']
      }
    ];

    for (var i=0; i < connections.length; i++) {
      var connection = connections[i];
      var server_id = Servers.insert({
        name: connection.name,
        servers: connection.servers,
        password: connection.password
      });
      for (var j=0; j < (connection.channels || []).length; j++) {
        var channel = connection.channels[j];
        if (!Channels.findOne({name: channel, server_id: server_id}))
          Channels.insert({name: channel, server_id: server_id, server_name: connection.name});
      }
    }
  }
  Fiber(initializeClients).run();
});
