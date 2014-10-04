/*
ChatLogStats: {
  _id: String,
  room_type: String,
  room_name: String,
  room_server_name: String,
  logs_count: Integer,
  timestamp: Datetime
}
*/
ChatLogStats = new Meteor.Collection('chat_log_stats');
