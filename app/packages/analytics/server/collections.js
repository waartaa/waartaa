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

// Index ChatLogStats
ChatLogStats._ensureIndex({
  room_type: 1,
  room_name: 1,
  room_server_name: 1,
  timestamp: 1
});

