Meteor.publish('servers', function () {
  return Servers.find();
});

Meteor.publish('user_servers', function () {
  var user_servers = UserServers.find({user_id: this.userId});
  var user = Meteor.users.findOne({_id: this.userId});
  return user_servers;
});

Meteor.publish('user_server_logs', function (user_server_id, n) {
  if (!this.userId)
    return;
  var user = Meteor.users.findOne({_id: this.userId});
  var N = n || CONFIG.show_last_n_logs;
  var cursor = UserServerLogs.find(
    {server_id: user_server_id, user: user.username},
    {
      sort: {created: -1}, limit: N
    }
  );
  return cursor;
});

Meteor.publish('user_channels', function () {
  if (!this.userId)
    return;
  var user = Meteor.users.findOne({_id: this.userId});
  var user_channels = UserChannels.find({user: user.username, active: true});
  var u = [];
  user_channels.forEach(function (channel) {
    u.push(channel.name);
  });
  console.log('Publishing channels for user: ' + this.userId);
  return user_channels;
});

Meteor.publish('user_channel_logs', function (channel_id, n) {
  if (!this.userId)
    return;
  var user = Meteor.users.findOne({_id: this.userId});
  var channel = UserChannels.findOne({_id: channel_id, user: user.username});
  if (!channel)
    return;
  console.log(
    'Publishing logs for channel: ' + channel.name + ', ' + user.username);
  var N = n || CONFIG.show_last_n_logs;
  var cursor = UserChannelLogs.find({channel_id: channel_id},
    {
      sort: {created: -1}, limit: N
    }
  );
  return cursor;
});

Meteor.publish(
  'pm_logs', function (room_id, n) {
    if (!room_id)
      return;
    var user = Meteor.users.findOne({_id: this.userId});
    console.log('publishing PMLogs');
    var nick = room_id.split('_')[1];
    var N = n || CONFIG.show_last_n_logs;
    var cursor = PMLogs.find({
      $or: [
        {from: nick},
        {to_nick: nick}
      ], user: user.username
    }, {sort: {created: -1}, limit: N});
    return cursor;
});

Meteor.publish('server_nicks', function () {
  var user = Meteor.users.findOne({_id: this.userId});
  if (!user)
    return;
  var server_ids = [];
  UserServers.find({user: user.username}, {_id: 1}).forEach(function (value) {
    server_ids.push(value.server_id);
  });
  console.log('publishing server nicks');
  return ServerNicks.find({server_id: {
    $in: server_ids}});
});

Meteor.publish('channel_nicks', function () {
  var user = Meteor.users.findOne({_id: this.userId});
  if (!user)
    return;
  var query_or = [];
  UserServers.find({user_id: user._id}).forEach(function (user_server) {
    var channel_names = [];
    var query_dict = {
      server_name: user_server.name, channel_name: {$in: channel_names}};
    UserChannels.find({
        user_server_id: user_server._id, active: true
      }).forEach(function (user_channel) {
        channel_names.push(user_channel.name);
      });
    query_or.push(query_dict);
    console.log(query_dict.channel_name);
  });
  console.log('publishing channel nicks');
  console.log(query_or);
  return ChannelNicks.find({$or: query_or});
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
      Channels.insert(
        {name: channel_name, server_id: server_id, server_name: server.name});
    }
    //console.log(server_id);
    //console.log(Clients);
    var client = Clients[us44er.username][server.name];
    client.join(channel_name, function () {
      //console.log('Joined channel: ' + channel_name);
    });
  }
});
