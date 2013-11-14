Meteor.publish('servers', function () {
  return Servers.find();
});

Meteor.publish('user_servers', function () {
  var user_servers = UserServers.find({user_id: this.userId});
  var user = Meteor.users.findOne({_id: this.userId});
  setTimeout(publish_user_server_logs, 1000, user);
  setTimeout(publish_pm_logs, 1000, user);
  return user_servers;
});

logs_published_for_servers = {}

function publish_user_server_logs (user) {
  if (!user)
    return;
  Fiber(function () {
    UserServers.find({user: user.username}).forEach(function (user_server) {
      if (typeof(logs_published_for_servers[user_server._id]) == "undefined") {
        Meteor.publish('user_server_logs_' + user_server._id, function (n) {
          var N = n || CONFIG.show_last_n_logs;
          var cursor = UserServerLogs.find({server_id: user_server._id},
            {
              sort: {created: -1}, limit: N
            }
          );
          return cursor;
        });
        logs_published_for_servers[user_server._id] = "";
      }
    });
  }).run();
}

Meteor.publish('user_channels', function () {
  var user = Meteor.users.findOne({_id: this.userId});
  if (!user)
    return;
  var user_channels = UserChannels.find({user: user.username, active: true});
  var u = [];
  user_channels.forEach(function (channel) {
    u.push(channel.name);
  });
  setTimeout(publish_user_channel_logs, 1000, user);
  return user_channels;
});

logs_published_for_channels = {};

function publish_user_channel_logs (user) {
  Fiber(function () {
    var user_channels = UserChannels.find({user: user.username, active: true});
    user_channels.forEach(function (channel) {
      if (typeof(logs_published_for_channels[channel._id]) == "undefined") {
        Meteor.publish("user_channel_logs_" + channel._id, function (n) {
          var N = n || CONFIG.show_last_n_logs;
          var cursor = UserChannelLogs.find({channel_id: channel._id},
            {
              sort: {created: -1}, limit: N
            }
          );
          return cursor;
        });
        logs_published_for_channels[channel._id] = "";
      }
    });
  }).run();
}

logs_published_for_pms = {};

function publish_pm_logs (user) {
  if (!user)
    return;
  Fiber(function () {
    UserServers.find({user: user.username}).forEach(function (user_server) {
      var nicks = user.profile.connections[user_server._id].pms;
      for (nick in nicks) {
        var room_id = user_server._id + '_' + nick;
        if (typeof(logs_published_for_pms[room_id]) == "undefined") {
          Meteor.publish(
            'pm_logs_' + room_id, function (n) {
              var N = n || CONFIG.show_last_n_logs;
              var cursor = PMLogs.find({
                $or: [
                  {from: nick},
                  {to_nick: nick}
                ], user: user.username
              }, {sort: {created: -1}, limit: N});
              return cursor;
          });
          logs_published_for_pms[room_id] = "";
        }
      }
    });
  }).run();
}

/*
Meteor.publish("user_channel_logs", function () {
  var N = CONFIG.show_last_n_logs;
  var user = Meteor.users.findOne({_id: this.userId});
  if (!user)
    return;
  var user_channels = UserChannels.find({user: user.username, active: true});
  var cursors = [];
  user_channels.forEach(function (channel) {
    var ids = [];
    var sub_query = {id: {$in: ids}};
    cursors.push(
      UserChannelLogs.find(
        {channel_id: channel._id},
        {
          sort: {$natural: -1}, limit: N
        })
    );
  });
  console.log(cursors);
  console.log('$$$$$$$$$$$$$$$');
  return cursors;
});
*/

/*
Meteor.publish("user_server_logs", function () {
  return UserServerLogs.find({user_id: this.userId});
})

Meteor.publish('pm_logs', function () {
  return PMLogs.find({$or: [
      {from_user_id: this.userId},
      {to_user_id: this.userId}
    ]
  });
});
*/

getUserChannels = function (user) {
  if (!user)
    return;
  var profile = user.profile;
  if (profile && profile.connections) {
    var query = {$or: []};
    var query_or = query.$or;
    for (i in profile.connections) {
      var channel_names = [];
      var conn = profile.connections[i];
      for (chan_name in conn.client_data.chans) {
        channel_names.push(chan_name);
      }
      query_or.push({
        server_name: conn.name, name: {$in: channel_names}
      });
    }
    return Channels.find(query);
  }
}

Meteor.publish('channels', function() {
  var user = Meteor.users.findOne({_id: this.userId});
  return [];//getUserChannels(user);
});

Meteor.publish('channel_logs', function () {
  var user = Meteor.users.findOne({_id: this.userId});
  var channels = []; //getUserChannels(user);
  var channel_ids = [];
  channels.forEach(function (channel) {
    channel_ids.push(channel._id);
  });
  return ChannelLogs.find({channel_id: {$in: channel_ids}});
})

Meteor.publish('user_server_users', function () {
  var user = Meteor.users.findOne({_id: this.userId});
  if (!user)
    return;
  var user_server_ids = [];
  UserServers.find({user: user.username}, {_id: 1}).forEach(function (value) {
    user_server_ids.push(value._id);
  });
  return UserServerUsers.find({user_server_id: {
    $in: user_server_ids}});
});

Meteor.methods({
  say: function(message, id, roomtype) {
    var user = Meteor.users.findOne({_id: this.userId});
    if (roomtype == 'channel') {
      var channel = Channels.findOne({_id: id});
      var server = channel.server_name;
      var to = channel.name;
    } else if (roomtype == 'pm') {
      var to = id.substr(id.indexOf('-') + 1);
      var server_id = id.split('-', 1)[0];
      var server = Servers.findOne({_id: server_id}).name;
    } else return;
    var client = Clients[user.username][server];
    client.say(to, message);
  },
  join: function (channel_name, server_id) {
    var user = Meteor.users.findOne({_id: this.userId});
    var server = Servers.findOne({_id: server_id});
    var channel = Channels.findOne({server_id: server_id, name: channel_name});
    if (!channel) {
      Channels.insert({name: channel_name, server_id: server_id, server_name: server.name});
    }
    console.log(server_id);
    console.log(Clients);
    var client = Clients[user.username][server.name];
    client.join(channel_name, function () {
      console.log('Joined channel: ' + channel_name);
    });
  }
});
