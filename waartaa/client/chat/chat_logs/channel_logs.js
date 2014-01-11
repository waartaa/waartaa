Handlebars.registerHelper('getCurrentChannel', function () {
  var room = Session.get('room') || {};
  if (room.roomtype == 'channel') {
    return UserChannels.findOne({_id: room.room_id});
  }
});

Handlebars.registerHelper("channelChatLogs", function (channel_id) {
  return UserChannelLogs.find({channel_id: channel_id}, {sort: {created: 1}});
});

Template.channel_logs.events = {
  'scrolltop .chat-logs-container': waartaa.chat.helpers.chatLogsContainerScrollCallback
};

Template.channel_chatlogs_end.rendered = function (e) {
  $('#chatlogs-loader').fadeOut();
};
