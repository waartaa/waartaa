Meteor.publish('servers', function () {
  return Servers.find();
});

Meteor.publish('user_servers', function () {
  return UserServers.find({user_id: this.userId});
});

Meteor.publish('user_channels', function () {
  console.log(UserChannels.find());
  var user = Meteor.users.findOne({_id: this.userId});
  var user_channels = UserChannels.find({user: user.username, active: true});
  var u = [];
  user_channels.forEach(function (channel) {
    u.push(channel.name);
  });
  console.log('********' + u + '**********');
  return user_channels;
});

Meteor.publish("user_channel_logs", function () {
  return UserChannelLogs.find({user_id: this.userId});
});

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

getUserChannels = function (user) {
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
