UI.registerHelper('getCurrentServer', function () {
  var room = Session.get('room');
  if (room.roomtype != 'server')
    return;
  return UserServers.findOne(
    {_id: room.room_id},
    {fields: {last_updated: 0, created: 0}}
  );
});

UI.registerHelper("serverChatLogs", function (server_id) {
  var cursor = UserServerLogs.find(
    {server_id: server_id}, {sort: {created: 1}});
  var last_log = UserServerLogs.findOne({server_id: server_id}, {sort: {created: -1}});
  Session.set('chatroom_last_log_id');
  if (last_log)
    Session.set('chatroom_last_log_id', last_log._id);
  else
    $('#chatlogs-loader:visible').fadeOut();
    
  var session_key = 'unreadLogsCountServer_' + server_id;
  cursor.observeChanges({
    added: function (id, fields) {
      Deps.nonreactive(function () {
        updateUnreadLogsCount(
          session_key, 'lastAccessedServer-' + fields.server_id,
          fields.last_updated)
      });
    }
  });
  return cursor;
});

Template.server_logs.events = {
  'scroll .chat-logs-container': waartaa.chat.helpers.chatLogsContainerScrollCallback
};
Template.server_logs.rendered = waartaa.chat.helpers.chatLogsContainerRendered;

