Meteor.startup(function () {
  Meteor.subscribe('unread_logs_count', function (err) {
    if (err)
      return;
  });
  Meteor.subscribe('unread_mentions_count');
  UnreadLogsCount.find().observeChanges({
    added: function (id, fields) {
      localChatRoomLogCount.reset(fields.room_signature);
    },
    removed: function (id) {
      localChatRoomLogCount.resetByUnreadLogCountId(id);
    }
  });
});
