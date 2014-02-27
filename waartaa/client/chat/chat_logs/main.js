function observeChatlogTableScroll () {
  var $table = $(this.find('.chatlogs-table'));
  var $container = $table.parent();
  var id = $table.attr('id');
  var old_table_height = Session.get('height-' + id, 0);
  var new_table_height = $table.find('.chatlogrows').height();
  if (Session.get('selfMsg-' + id) ||
      Session.get('chatlogsScrollEnd-' + id) &&
      Session.get('chatlogsScrollEnd-' + id) == $table.scrollTop()) {
    $container.nanoScroller({ scroll: 'bottom' });
    Session.set('selfMsg-' + id);
  } else if ($table.scrollTop() == 0 && new_table_height > old_table_height) {
    $container.nanoScroller({scrollTop: (new_table_height - old_table_height)});
  }
  Session.set('height-' + id, new_table_height);
  Meteor.setTimeout(function () {
    $table.off('scrolltop').on('scrolltop',
      waartaa.chat.helpers.chatLogsContainerScrollCallback);
  }, 2000);
}

Template.channel_chat_logs_table.rendered = observeChatlogTableScroll;
Template.server_chat_logs_table.rendered = observeChatlogTableScroll;
Template.pm_chat_logs_table.rendered = observeChatlogTableScroll;
