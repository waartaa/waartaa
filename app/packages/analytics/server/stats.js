ChatRoomLogCountManager = function () {
  var locks = Npm.require('locks');
  var self = this;
  self._data = {};
  self._lock = locks.createReadWriteLock();
  self._queue = new PowerQueue({
    name: "chat_room_log_count_save_queue",
    debug: true,
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
  var intervalText = (
    (Meteor.settings || {}).chat || {}).roomLogCountSaveInterval ||
    'every 10 seconds';
  var schedule = later.parse.text(intervalText);
  var hourlyLogCountSaver = new ScheduledTask(schedule, _saveChatroomLogCount);
  hourlyLogCountSaver.start();
};


ChatRoomLogCountManager.prototype._getRoomInfoFromSignature = function (
    chatRoomSignature) {
  var items = chatRoomSignature.split('::');
  var roomInfo = {
    roomType: null,
    roomName: null,
    serverName: null,
    user: null
  }
  if (items.length == 1) {
    roomInfo.roomType = 'server';
    var tmp = items[0].split('||');
    if (tmp.length > 1) {
      roomInfo.user = tmp[0];
      roomInfo.serverName = roomInfo.roomName = tmp[1];
    } else
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
  var selector = {
    room_type: roomInfo.roomType, room_name: roomInfo.roomName,
    room_server_name: roomInfo.serverName, timestamp: timestamp,
    user: roomInfo.user
  };
  var chatLogStat = ChatLogStats.findOne(selector) || {};
  ChatLogStats.upsert(selector, {
      $set: {
        logs_count: (chatLogStat.logs_count || 0) + (
          chatRoomLogCount.prevCount || 0)
      }
    }
  );
};


ChatRoomLogCountManager.prototype.increment = function (chatRoomSignature) {
  var self = this;
  self._lock.timedReadLock(5000, function () {
    var chatRoomLogCountData = self._data[chatRoomSignature] || {};
    console.log(chatRoomSignature, chatRoomLogCountData);
    chatRoomLogCountData.currentCount = (
      chatRoomLogCountData.currentCount || 0) + 1;
    self._data[chatRoomSignature] = chatRoomLogCountData;
    self._lock.unlock();
    console.log(chatRoomLogCountData);
  });
};

ChatRoomLogCountManager.prototype.getCurrentLogCountForInterval = function (
    roomSignature) {
  var self = this;
  return (self._data[roomSignature] || {}).currentCount || 0;
};

ChatRoomLogCountManager.prototype.timestampToHour = function (timestamp) {
  timestamp.setMilliseconds(0);
  timestamp.setSeconds(0);
  timestamp.setMinutes(0);
  return timestamp;
};

ChatRoomLogCountManager.prototype.getChatRoomLogsCountSince = function (
    roomSignature, timestamp, offset) {
  var self = this;
  //timestamp = self.timestampToHour(timestamp);
  var roomInfo = self._getRoomInfoFromSignature(roomSignature);
  var chatRoomLogCountData = self._data[roomSignature] || {};
  var count = chatRoomLogCountData.currentCount || 0;
  console.log({
    room_type: roomInfo.roomType, room_name: roomInfo.roomName,
    room_server_name: roomInfo.serverName, timestamp: {$gt: timestamp},
    offset: offset,
  });
  var selector = {
    room_type: roomInfo.roomType, room_name: roomInfo.roomName,
    room_server_name: roomInfo.serverName, timestamp: {$gte: timestamp}
  };
  if (roomInfo.user)
    selector.user = roomInfo.user
  ChatLogStats.find(selector).forEach(function (item) {
    count += item.logs_count || 0;
  });
  count = count - (offset || 0);
  count = count > 0? count: 0;
  console.log('getChatRoomLogsCountSince', count);
  return count;
};

chatRoomLogCount = new ChatRoomLogCountManager();
