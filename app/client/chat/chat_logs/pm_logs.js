Template.pm_logs.events = {
  'scroll .chat-logs-container': waartaa.chat.helpers.chatLogsContainerScrollCallback
};

UI.registerHelper("pmChatLogs", function (server_id, nick) {
  var last_log = PMLogs.findOne(
    {
      $or: [{from: nick}, {to_nick: nick}],
      server_id: server_id
    }, {sort: {created: -1}},
    {fields: {created: 0, last_updated: 0}});
  Session.set('chatroom_last_log_id');
  if (last_log)
    Session.set('chatroom_last_log_id', last_log._id);
  else
    $('#chatlogs-loader:visible').fadeOut();
  return PMLogs.find(
    {
      $or: [{from: nick}, {to_nick: nick}],
      server_id: server_id
    }, {sort: {created: 1}},
    {fields: {created: 0, last_updated: 0}});
});

Template.pm_chat_row.created = waartaa.chat.helpers.chatLogRowCreateHandler;
Template.pm_chat_row.rendered = waartaa.chat.helpers.chatLogRowRenderedHandler;

