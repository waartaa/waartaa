Meteor.startup(function () {
  
  Meteor.subscribe('unread_logs_count', function (err) {
    if (err)
      return;
    UnreadLogsCount.find().observeChanges({
      added: function (id, fields) {
        localChatRoomLogCount.reset(fields.room_signature);
      },
      removed: function (id) {
        localChatRoomLogCount.resetByUnreadLogCountId(id);
      }
    });
  });
});
