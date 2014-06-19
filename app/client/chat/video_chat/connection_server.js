var serverRoomSelectHandler = waartaa.chat.helpers.serverRoomSelectHandler;

Template.video_chat_connection_server.events({
  'click .server-room': serverRoomSelectHandler,
  'click .server-link': serverRoomSelectHandler
});

Template.video_chat_connection_server.helpers({
  showStatusIcon: function () {
    var status = Session.get('easyrtcStatus') || 'disconnected';
    if (status == 'connected')
      return 'glyphicon-ok-circle';
    else if (status == 'disconnected')
      return 'glyphicon-ban-circle';
    else if (status == 'connecting')
      return 'spin glyphicon-refresh';
  }
});

Template.video_chat_connection_server.rendered = function () {
  VideoChat.init({
    'socketUrl': '//localhost:8080'
  });
};
