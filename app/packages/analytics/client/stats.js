LocalChatRoomLogCountManager = function () {
  var self = this;
  self._data = {};
};

LocalChatRoomLogCountManager.prototype.reset = function (
    chatRoomSignature) {
  UnreadLogsDelta._collection.upsert(
    {
      room_signature: chatRoomSignature,
    },
    {$set: {count: 0}}
  );
};

LocalChatRoomLogCountManager.prototype.increment = function (
    chatRoomSignature) {
  UnreadLogsDelta._collection.upsert(
    {
      room_signature: chatRoomSignature,
    },
    {$inc: {count: 1}}
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
