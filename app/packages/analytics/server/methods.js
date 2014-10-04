Meteor.methods({
  resetUnreadLogCount: function (chatRoomSignature) {
    var user = Meteor.users.findOne({_id: this.userId});
    if (!user)
      return;
    var currentIntervalCount = (
      chatRoomLogCount.getCurrentLogCountForInterval(chatRoomSignature) || 0);
    UnreadLogsCount.upsert(
      {room_signature: chatRoomSignature, user: user.username},
      {$set: {
        count: 0,
        offset: currentIntervalCount,
        last_updated_at: new Date()
      }});
  }
});