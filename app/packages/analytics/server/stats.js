ChatRoomLogCountManager = function () {
  var locks = Npm.require('locks');
  var self = this;
  self._data = {};
  self._lock = locks.createReadWriteLock();
  self._queue = new PowerQueue({
    name: "chat_room_log_count_save_queue",
    debug: CONFIG.QUEUE_DEBUG || false,
    maxProcessing: 1
  });

  function _saveChatroomLogCount () {
    var timestamp = new Date();
    timestamp.setSeconds(0);
    timestamp.setMinutes(0);
    timestamp.setMilliseconds(0);
    self._lock.writeLock(function () {
      _.each(self._data, function (value, key) {
        value = value || {};
        value.prevCount = value.currentCount || 0;
        value.currentCount = 0;
        self._data[key] = value;
        self._saveChatroomLogCountToDb(key, value, timestamp);
      });
      self._lock.unlock();
    });
  }
  //var schedule = later.parse.recur().on(0).minute();
  var schedule = later.parse.text('every 15 seconds');
  var hourlyLogCountSaver = new ScheduledTask(
    schedule, _saveChatroomLogCount);
  hourlyLogCountSaver.start();
};


ChatRoomLogCountManager.prototype._getRoomInfoFromSignature = function (
    chatRoomSignature) {
  var items = chatRoomSignature.split('::');
  var roomInfo = {
    roomType: null,
    roomName: null,
    serverName: null
  }
  if (items.length == 1) {
    roomInfo.roomType = 'server';
    roomInfo.serverName = roomInfo.roomName = items[0];
  } else if (items.length == 2) {
    roomInfo.serverName = items[0];
    if (items[1].search('#') == 0)
      roomInfo.roomType = 'channel';
    else
      roomInfo.roomType = 'pm';
    roomInfo.roomName = items[1];
  }
  return roomInfo;
};


ChatRoomLogCountManager.prototype._saveChatroomLogCountToDb = function (
    chatRoomSignature, chatRoomLogCount, timestamp) {
  var self = this;
  var roomInfo = self._getRoomInfoFromSignature(chatRoomSignature);
  ChatLogStats.upsert(
    {
      room_type: roomInfo.roomType, room_name: roomInfo.roomName,
      room_server_name: roomInfo.serverName, timestamp: timestamp
    }, {
      $set: {logs_count: chatRoomLogCount.prevCount || 0}
    }
  );
};


ChatRoomLogCountManager.prototype.increment = function (chatRoomSignature) {
  var self = this;
  self._lock.timedReadLock(5000, function () {
    var chatRoomLogCountData = self._data[chatRoomSignature] || {};
    console.log(chatRoomLogCountData);
    chatRoomLogCountData.currentCount = (
      chatRoomLogCountData.currentCount || 0) + 1;
    self._data[chatRoomSignature] = chatRoomLogCountData;
    self._lock.unlock();
    console.log(chatRoomLogCountData);
  });
};
