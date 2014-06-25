function observeChatlogTableScroll () {
  var $table = $(this.find('.chatlogs-table'));
  var $container = $table.parent();
  var id = $table.attr('id');
  var old_table_height = Session.get('height-' + id, 0);
  var new_table_height = $table.find('.chatlogrows').height();
  if (Session.get('selfMsg-' + id) ||
      Session.get('chatlogsScrollEnd-' + id) &&
      Session.get('chatlogsScrollEnd-' + id) == $table.scrollTop()) {
    $container.scrollTop($container.height());
    Session.set('selfMsg-' + id);
  } else if ($table.scrollTop() == 0 && new_table_height > old_table_height) {
    $container.scrollTop(new_table_height - old_table_height);
  }
  Session.set('height-' + id, new_table_height);
  Meteor.setTimeout(function () {
    $table.off('scroll').on('scroll',
      waartaa.chat.helpers.chatLogsContainerScrollCallback);
  }, 2000);
}

Template.channel_chat_logs_table.created = function () {
  Meteor.setTimeout(observeChatlogTableScroll, 0);
  waartaa.chat.helpers.chatLogsTableCreateHandler();
};
Template.server_chat_logs_table.created = function () {
  Meteor.setTimeout(observeChatlogTableScroll, 0);
  waartaa.chat.helpers.chatLogsTableCreateHandler();
};
Template.pm_chat_logs_table.created = function () {
  Meteor.setTimeout(observeChatlogTableScroll, 0);
  waartaa.chat.helpers.chatLogsTableCreateHandler();
};

