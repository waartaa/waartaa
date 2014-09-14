Template.channel_chat_logs.created = function () {
  waartaa.chat.helpers.chatLogsTableCreateHandler();
};
Template.server_chat_logs.created = function () {
  waartaa.chat.helpers.chatLogsTableCreateHandler();
};
Template.pm_chat_logs.created = function () {
  waartaa.chat.helpers.chatLogsTableCreateHandler();
};

UI.registerHelper('getCurrentRoomTopic', function () {
  var room = Session.get('room');
  if (room && room.roomtype == 'channel')
    return (UserChannels.findOne({_id: room.channel_id}) || {}).topic;
});