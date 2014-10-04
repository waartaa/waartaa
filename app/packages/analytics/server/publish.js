Meteor.startup(function () {

  Meteor.publish('unread_logs_count', function () {
    user = Meteor.users.findOne({_id: this.userId});
    if (!user) {
      this.ready();
      return;
    }
    cursor = UnreadLogsCount.find({
      user: user.username});
    Meteor.setTimeout(function () {
      console.log('UNREAD_LOGS_COUNT');
      UserChannels.find({
        user: user.username, active: true
      }).forEach(function (item) {
        var UNREAD_LOGS_COUNT_UPPER_LIMIT = 100;
        // FIXME
        // Meteor.settings.public.UREAD_LOGS_COUNT_UPPER_LIMIT
        //if (item.count > UNREAD_LOGS_COUNT_UPPER_LIMIT)
        //  return;
        var roomSignature = item.user_server_name + '::' + item.name;
        var chatRoomUnreadLogCount = UnreadLogsCount.findOne({
          room_signature: roomSignature, user: user.username
        }) || {};
        var timestamp = chatRoomLogCount.last_updated_at || item.last_updated;
        var count = chatRoomUnreadLogCount.count || 0;
        count += chatRoomLogCount.getChatRoomLogsCountSince(
          roomSignature, item.last_updated, item.offset);
        UnreadLogsCount.upsert(
          {room_signature: roomSignature, user: user.username},
          {$set: {
            count: count,
            offset: chatRoomLogCount.getCurrentLogCountForInterval(
              roomSignature),
            last_updated_at: new Date()
          }});
      });
    }, 100);
    if (!cursor.count())
      this.ready();
    return cursor;
  });
});
