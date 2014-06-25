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
  if (channel) {
    var last_log = ChannelLogs.findOne({channel_name: channel.name}, {sort: {created: -1}});
    Session.set('chatroom_last_log_id');
    if (last_log)
      Session.set('chatroom_last_log_id', last_log._id);
    else
      $('#chatlogs-loader:visible').fadeOut();
    return ChannelLogs.find({channel_name: channel.name}, {sort: {created: 1}});
  }
});

Template.channel_logs.events = {
  'scroll .chat-logs-container': waartaa.chat.helpers.chatLogsContainerScrollCallback
};

Template.channel_logs.rendered = waartaa.chat.helpers.chatLogsContainerRendered;
Template.chat_row.created = waartaa.chat.helpers.chatLogRowCreateHandler;
Template.chat_row.rendered = waartaa.chat.helpers.chatLogRowRenderedHandler;

