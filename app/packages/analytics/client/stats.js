LocalChatRoomLogCountManager = function () {
  var self = this;
  self._data = {};
};

LocalChatRoomLogCountManager.prototype.reset = function (
    chatRoomSignature) {
  var unreadLogsCount = UnreadLogsCount.findOne({
    room_signature: chatRoomSignature}) || {};
  UnreadLogsDelta._collection.upsert(
    {
      room_signature: chatRoomSignature,
    },
    {
      $set: {count: 0, unread_log_count_id: unreadLogsCount._id}
    }
  );
};

LocalChatRoomLogCountManager.prototype.resetByUnreadLogCountId = function (
    id) {
  UnreadLogsDelta._collection.upsert(
    {unread_log_count_id: id},
    {$set: {count: 0}}
  );
};

LocalChatRoomLogCountManager.prototype.increment = function (
    chatRoomSignature) {
  var unreadLogsCount = UnreadLogsCount.findOne({
    room_signature: chatRoomSignature});
  if (!unreadLogsCount)
    return;
  UnreadLogsDelta._collection.upsert(
    {
      room_signature: chatRoomSignature,
    },
    {
      $inc: {count: 1},
      $set: {unread_log_count_id: unreadLogsCount._id}
    }
  );
};

LocalChatRoomLogCountManager.prototype.unreadLogsCount = function (
    chatRoomSignature) {
  return (
      (
        UnreadLogsCount.findOne({
          room_signature: chatRoomSignature}) ||{}
      ).count || 0) + (
      (
        UnreadLogsDelta.findOne({
          room_signature: chatRoomSignature}) || {}
      ).count || 0);
};

localChatRoomLogCount = new LocalChatRoomLogCountManager();
