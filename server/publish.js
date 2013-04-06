Servers = new Meteor.Collection("servers");
Channels = new Meteor.Collection("channels");
ChannelLogs = new Meteor.Collection("channel_logs");
clients = new Meteor.Collection('clients');

Meteor.publish('servers', function () {
  var user = Meteor.users.findOne({_id: this.userId});
  var profile = user.profile;
  var server_names = [];
  if (profile && profile.connections) {
    for (var i=0; i < profile.connections.length; i++) {
      server_names.push(profile.connections[i].name);
    }
  }
  return Servers.find({name: {$in: server_names}});
});

getUserChannels = function (user) {
  var profile = user.profile;
  var channel_names = [];
  if (profile && profile.connections) {
    var query = {$or: []};
    var query_or = query.$or;
    for (var i=0; i < profile.connections.length; i++) {
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
  say: function(message, channel_id) {
    var user = Meteor.users.findOne({_id: this.userId});
    var channel = Channels.findOne({_id: channel_id});
    var server = channel.server_name;
    var client = Clients[user.username][server];
    client.say(channel.name, message);
  }
});
