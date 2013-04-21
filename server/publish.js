Servers = new Meteor.Collection("servers");
Channels = new Meteor.Collection("channels");
ChannelLogs = new Meteor.Collection("channel_logs");
PMLogs = new Meteor.Collection("pm_logs");
clients = new Meteor.Collection('clients');

Meteor.publish('servers', function () {
  var user = Meteor.users.findOne({_id: this.userId});
  var profile = user.profile;
  var server_names = [];
  if (profile && profile.connections) {
    for (i in profile.connections) {
      server_names.push(profile.connections[i].name);
    }
  }
  return Servers.find({name: {$in: server_names}});
});

Meteor.publish('pm_logs', function () {
  return PMLogs.find({$or: [
      {from_user_id: this.userId},
      {to_user_id: this.userId}
    ]
  });
});

getUserChannels = function (user) {
  var profile = user.profile;
  var channel_names = [];
  if (profile && profile.connections) {
    var query = {$or: []};
    var query_or = query.$or;
    for (i in profile.connections) {
      var conn = profile.connections[i];
      query_or.push({
        server_name: conn.name, name: {$in: conn.channels}
      });
    }
    return Channels.find(query);
  }
}

Meteor.publish('channels', function() {
  var user = Meteor.users.findOne({_id: this.userId});
  return getUserChannels(user);
});

Meteor.publish('channel_logs', function () {
  var user = Meteor.users.findOne({_id: this.userId});
  var channels = getUserChannels(user);
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
  }
});
