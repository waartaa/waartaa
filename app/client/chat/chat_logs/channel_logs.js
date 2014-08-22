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
    var currentPath = Router.current();
    var paginationStartLog = Session.get('paginationStartLog');
    var query = {channel_name: channel.name};
    if (Session.get('showRealtimeLogs') == false && paginationStartLog) {
      query.last_updated = {
        $lte: paginationStartLog.last_updated
      };
    }
    return ChannelLogs.find(query, {sort: {created: 1}});
  }
});

Template.channel_logs.events = {
  'scroll .chat-logs-container': waartaa.chat.helpers.chatLogsContainerScrollCallback
};

Template.channel_logs.rendered = waartaa.chat.helpers.chatLogsContainerRendered;
Template.chat_row.created = waartaa.chat.helpers.chatLogRowCreateHandler;
Template.chat_row.rendered = waartaa.chat.helpers.chatLogRowRenderedHandler;
Template.chat_row.destroyed = waartaa.chat.helpers.chatLogRowDestroyedHandler;
