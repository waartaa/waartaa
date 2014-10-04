/*
UnreadLogsCount: {
  room_signature: String,
  count: Integer,
  active: Boolean,
  username: String
  last_updated_at: Date,
  offset: Integer
}
*/
UnreadLogsCount = new Meteor.Collection('unread_logs_count');
