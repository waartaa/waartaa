Servers = new Meteor.Collection("servers");
Channels = new Meteor.Collection("channels");
ChannelLogs = new Meteor.Collection("channel_logs");
PMLogs = new Meteor.Collection("pm_logs");
clients = new Meteor.Collection('clients');
ServerLogs = new Meteor.Collection("server_logs");

Meteor.publish('servers', function () {
  var user = Meteor.users.findOne({_id: this.userId});
  if (user) {
    var profile = user.profile;
    var server_names = [];
    if (profile && profile.connections) {
      for (i in profile.connections) {
        server_names.push(profile.connections[i].name);
      }
    }
    return Servers.find({name: {$in: server_names}});
  }
});

Meteor.publish('pm_logs', function () {
  return PMLogs.find({$or: [
      {from_user_id: this.userId},
      {to_user_id: this.userId}
    ]
  });
});

Meteor.publish('server_logs', function () {
  return ServerLogs.find({to_user_id: this.userId});
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
