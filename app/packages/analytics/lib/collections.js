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


/*
UnreadMentionsCount: {
  room_signature: String,
  nick: String,
  count: Integer,
  active: Boolean,
  username: String,
  last_updated_at: Date
}
*/
UnreadMentionsCount = new Meteor.Collection("unread_mentions_count");


/* Perms */
if (Meteor.isServer) {
  UnreadMentionsCount.allow({
    update: function (userId, doc, fieldNames, modifier) {
      var user = Meteor.users.findOne({_id: userId});
      if (user && modifier.$set.username &&
          modifier.$set.username != user.username)
        return false;
      return true;
    }
  });
}
