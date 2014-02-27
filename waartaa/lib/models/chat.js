/*
Severs: {
  name: String,
  creator: String <username>,
  creator_id: String <user_id>,
  last_updater: String,
  last_updater_id: String,
  created: Date,
  last_updated: Date,
  connections: List of items like {url: 'irc.freenode.net', port: '6667'}
}
*/
Servers = new Meteor.Collection("servers");

/*
UserServers: {
  name: String,
  server_id: String,
  nick: String,
  password: String,
  channels: A list of strings,
  user: String,
  user_id: String,
  created: Date,
  creator: String <username>,
  creator_id: Sring <user_id>,
  last_updated: Date,
  last_updater: String <username>,
  last_updater_id: String <user_id>,
  status: String (online/offline/connecting)
}
*/
UserServers = new Meteor.Collection("user_servers");

/*
ServerConnections: {
  server_id: String,
  url: String,
  port: String,
  creator: String,
  creator_id: String,
  last_updater: String,
  last_updater_id: String,
  created: Date,
  last_updated: Date
}
*/
ServerConnections = new Meteor.Collection("server_connections");

/*
UserChannels: {
  name: String,
  server_id: String,
  server_name: String,
  //nicks: Dictionary,
  password: String,
  creator: String,
  creator_id: String,
  last_updater: String,
  last_updater_id: String,
  created: Date,
  last_updated: Date
}
*/
UserChannels = new Meteor.Collection("user_channels");

/*
ChannelCredentials: {
  channel_name: String,
  channel_id: String,
  username: String,
  user_id: String,
  password: String,
  created: Date,
  last_updated: Date
}
*/
ChannelCredentials = new Meteor.Collection("channel_credentials");

/*
ChannelLogs: {
  channel_id: String,
  channel_name: String,
  server_id: String,
  server_name: String,
  message: String,
  raw_message: String,
  from: String,
  from_username: String,
  from_user_id: String,
  created: Date,
  last_updated: Date,
  type: String (global/private)
  sent: Boolean,
  author: String,
  author_id: String,
  user: String,
  user_id: String
}
*/
ChannelLogs = new Meteor.Collection("channel_logs");
UserChannelLogs = new Meteor.Collection("user_channel_logs");
OldChannelLogs = new Meteor.Collection("old_channel_logs");

/*
PMLogs: {
  server_name: String,
  server_id: String,
  message: String,
  raw_message: String,
  from_nick: String,
  from_username: String,
  from_user_id: String,
  to_nick: String,
  to_username: String,
  to_user_id: String,
  sent: Boolean,
  created: Date,
  last_updated: Date,
  type: String (global/private),
  user: String,
  user_id: String
}
*/
PMLogs = new Meteor.Collection("pm_logs");

/*
ServerLogs: {
  server_id: String,
  server_name: String,
  message: String,
  raw_message: String,
  from: String,
  from_nick: String,
  from_username: String,
  from_user_id: String,
  created: Date,
  last_updated: Date,
  sent: Boolean,
  author: String,
  author_id: String,
  user: String,
  user_id: String
}
*/
UserServerLogs = new Meteor.Collection("user_server_logs");

/*
ServerNicks: {
  nick: 'rtnpro_wc',
  user: '7bc98086',
  host: 'gateway/web/freenode/ip.123.201.128.134',
  realname: '123.201.128.134 - http://webchat.freenode.net',
  channels: [ '#bcrec', '#bcreclug' ],
  server: 'herbert.freenode.net',
  serverinfo: 'DE',
  away: '"foo"' ,
  server_name: String
}
*/
ServerNicks = new Meteor.Collection("server_nicks");

/*
ChannelNicks: {
  'channel_name': String,
  'server_name': String,
  'nick': String
}
*/
ChannelNicks = new Meteor.Collection("channel_nicks");

/*
WhoDataPollLock: {
  server_name: String,
  channel_name: String,
  lock_owner: String,
  created: Datetime,
  last_updated: Datetime
}
*/
WhoDataPollLock = new Meteor.Collection("who_data_poll_lock");

/*
Create indices:
> db.user_servers.ensureIndex({_id: 1, name: 1, user_id: 1})
> db.user_server_logs.ensureIndex({server_id: 1})
> db.user_server_logs.ensureIndex({server_id: 1, created: 1})
> db.user_channels.ensureIndex({user: 1, active: 1})
> db.user_channel_logs.ensureIndex({channel_id: 1})
> db.pm_logs.ensureIndex({user: 1, from: 1, to_nick: 1})
> db.server_nicks.ensureIndex({user_server_id: 1})
> db.channel_nicks.ensureIndex({server_name: 1, channel_name: 1, nick: 1}, {unique: true, dropDups: true})*/

/*
UserPms: {
  user: String,
  user_id: String,
  user_server_name: String,
  user_server_id: String,
  pms: List,
}
*/
UserPms = new Meteor.Collection("user_pms");
