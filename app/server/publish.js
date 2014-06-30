Meteor.publish('servers', function () {
  if (this.userId)
    return Servers.find();
  this.ready();
});

Meteor.publish('user_servers', function () {
  if (this.userId)
    return user_servers = UserServers.find(
      {user_id: this.userId, active: true},
      {created: 0, last_updated: 0});
  this.ready();
});

Meteor.publish('user_server_logs', function (user_server_name, n) {
  if (this.userId) {
    var user = Meteor.users.findOne({_id: this.userId});
    var N = n || CONFIG.show_last_n_logs;
    var cursor = UserServerLogs.find(
      {server_name: user_server_name, user: user.username},
      {
        sort: {created: -1}, limit: N
      }
    );
    return cursor;
  }
  this.ready();
});

Meteor.publish('user_channels', function () {
  if (this.userId) {
    var user = Meteor.users.findOne({_id: this.userId});
    var user_channels = UserChannels.find(
      {user: user.username, active: true},
      {last_updated: 0, created: 0});
    var u = [];
    user_channels.forEach(function (channel) {
      u.push(channel.name);
    });
    console.log('Publishing channels for user: ' + this.userId);
    return user_channels;
  }
  this.ready();
});

Meteor.publish('channel_logs', function (channel_name, n) {
  var user = Meteor.users.findOne({_id: this.userId}) || {};
  console.log(user);
  var channel = UserChannels.findOne({name: channel_name, user: user.username});
  console.log('CHANNEL');
  console.log(channel);
  if (channel) {
    console.log(
      'Publishing logs for channel: ' + channel.name + ', ' + user.username);
    var N = n || CONFIG.show_last_n_logs;
    var cursor = ChannelLogs.find(
      {
        channel_name: channel.name,
        $or: [
          {global: true, not_for_user: {$ne: user.username}},
          {from_user: user.username},
          {user: user.username}
        ]
      },
      {
        sort: {created: -1}, limit: N
      }
    );
    return cursor;
  }
  this.ready();
});

Meteor.publish(
  'pm_logs', function (room_id, n) {
    var user = Meteor.users.findOne({_id: this.userId});
    if (room_id && user) {
      console.log('publishing PMLogs');
      var nick = room_id.slice(room_id.search('_') + 1);
      var N = n || CONFIG.show_last_n_logs;
      var cursor = PMLogs.find({
        $or: [
          {from: nick},
          {to_nick: nick}
        ], user: user.username
      }, {sort: {created: -1}, limit: N});
      return cursor;
    }
    this.ready();
});

Meteor.publish('user_pms', function () {
  return UserPms.find({user_id: this.userId});
});
/*
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
    $in: server_ids}}, {last_updated: 0, created: 0});
});
*/

Meteor.publish('server_nicks', function (server_name, nicks) {
  if (server_name && nicks)
    return ServerNicks.find(
      {server_name: server_name, nick: {$in: nicks}},
      {fields: {created: 0, last_updated: 0}}
    );
  this.ready();
})

Meteor.publish('channel_nicks', function (server_name, channel_name, from, to) {
  var user = Meteor.users.findOne({_id: this.userId});
  if (!user) {
    this.ready();
    return;
  }
  var query_or = [];
  if (server_name && channel_name) {
    var query = {server_name: server_name, channel_name: channel_name};
    var start_nick = ChannelNicks.findOne(
      {channel_name: channel_name, server_name: server_name},
      {sort: {nick: 1}});
    var last_nick = ChannelNicks.findOne(
      {channel_name: channel_name, server_name: server_name},
      {sort: {nick: -1}});
    if (to && start_nick && start_nick.nick == to) {
      from = to;
      to = null;
    } else if (from && last_nick && last_nick.nick == from) {
      to = from;
      from = null;
    }
    var sort_dict = {nick: 1};
    if (to) {
      query['nick'] = {$lte: to};
      sort_dict = {nick: -1};
    }
    else if (from) {
      query['nick'] = {$gte: from};
    }
    return ChannelNicks.find(
      query,
      {fields: {created: 0, last_updated: 0}, limit: 40, sort: sort_dict});
  } else {
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
    if (query_or.length > 0)
      return ChannelNicks.find({$or: query_or},
        {fields: {created: 0, last_updated: 0}});
  }
  this.ready();
});

Meteor.publish('channel_nick_suggestions',
  function (server_name, channel_name, pattern, limit) {
    var _this = this;
    ChannelNicks.find(
      {
        server_name: server_name,
        channel_name: channel_name,
        nick: {$regex: '^' + pattern + '.+'},
      },
      {
        fields: {last_upated: 0, created: 0},
        limit: limit || 10
      }
    ).forEach(function (channel_nick) {
      console.log('channel_nick_suggestions_added');
      console.log(channel_nick);
      _this.added('channel_nick_suggestions', channel_nick._id, channel_nick);
    });
    _this.ready();
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
