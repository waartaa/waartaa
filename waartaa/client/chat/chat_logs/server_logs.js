Handlebars.registerHelper('currentServer', function () {
  var room = Session.get('room');
  if (room.roomtype != 'server')
    return;
  return server = UserServers.findOne({_id: room.room_id});
});

Template.server_logs.events = {
  'scroll .chat-logs-container': waartaa.chat.helpers.chatLogsContainerScrollCallback
};

Template.server_chatlogs_end.rendered = function () {
    $('#chatlogs-loader').fadeOut();
};
