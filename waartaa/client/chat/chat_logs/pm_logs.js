Template.pm_logs.events = {
  'scroll .chat-logs-container': waartaa.chat.helpers.chatLogsContainerScrollCallback
};

UI.registerHelper("pmChatLogs", function (server_id, nick) {
  return PMLogs.find(
    {
      $or: [{from: nick}, {to_nick: nick}],
      server_id: server_id
    }, {sort: {created: 1}},
    {fields: {created: 0, last_updated: 0}});
});

Template.pm_chatlogs_end.rendered = function () {
  $('#chatlogs-loader').hide();
};
