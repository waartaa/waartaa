function setUpChatLogStatsFixtures () {
  ChatLogStats.remove({});
  ChatLogStats.insert({
      room_type: 'channel', room_name: '#foo',
      room_server_name: 'bar', timestamp: new Date("2014-10-1 2:00"),
      logs_count: 50
  });
  ChatLogStats.insert({
      room_type: 'channel', room_name: '#foo',
      room_server_name: 'bar', timestamp: new Date("2014-10-1 3:00"),
      logs_count: 70
  });
  ChatLogStats.insert({
    room_type: 'channel', room_name: '#foo',
    room_server_name: 'bar', timestamp: new Date("2014-10-1 4:00"),
    logs_count: 100
  }); 
}

Tinytest.add('analytics:TestChatRoomLogCountsSince', function (test) {
  setUpChatLogStatsFixtures();
  var roomSignature = 'bar::#foo';
  var chatRoomLogCount = new ChatRoomLogCountManager();
  for (i=0; i < 50; i++) {
    chatRoomLogCount.increment(roomSignature);
  }
  test.equal(
    chatRoomLogCount.getChatRoomLogsCountSince(
      roomSignature, new Date("2014-10-1 1:30"), 30),
    240,
    'Assert unread log counts for a chat room since a timestamp');
});
