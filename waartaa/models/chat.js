/*
Severs: {
  name: String,
  type: String (global/private),
  creator: String <username>,
  creator_id: String <user_id>,
  last_updater: String,
  last_updater_id: String,
  parent: String (server_id),
  created: Date,
  last_updated: Date
}
*/
Servers = new Meteor.Collection("servers");

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
Channels: {
  name: String,
  server_id: String,
  server_name: String,
  users: Dictionary,
  creator: String,
  creator_id: String,
  last_updater: String,
  last_updater_id: String,
  created: Date,
  last_updated: Date
}
*/
Channels = new Meteor.Collection("channels");

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
  from_nick: String,
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
ServerLogs = new Meteor.Collection("server_logs");