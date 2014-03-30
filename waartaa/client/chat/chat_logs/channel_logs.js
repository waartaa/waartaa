UI.registerHelper('getCurrentChannel', function () {
  var room = Session.get('room') || {};
  if (room.roomtype == 'channel') {
    return UserChannels.findOne(
        {_id: room.room_id},
        {fields: {last_updated: 0, created: 0}
    });
  }
});

UI.registerHelper("channelChatLogs", function (channel_id) {
  var channel = UserChannels.findOne({_id: channel_id});
  if (channel)
    return ChannelLogs.find({channel_name: channel.name}, {sort: {created: 1}});
});

Template.channel_logs.events = {
  'scrolltop .chat-logs-container': waartaa.chat.helpers.chatLogsContainerScrollCallback
};

Template.channel_chatlogs_end.rendered = function (e) {
  $('#chatlogs-loader').fadeOut();
};
