waartaa.chat.helpers.chatLogRowCreateHandler = function () {
    if (Session.get('shallUpdateHeight')) {
      Meteor.setTimeout(updateHeight, 0);
      Session.set('shallUpdateHeight');
    }
    $('.chat-logs-container.nano').nanoScroller();
    var last_log_id = Session.get('chatroom_last_log_id');
    var current_oldest_log_id_in_room = Session.get('oldest_log_id_in_room');
    if (last_log_id && !current_oldest_log_id_in_room)
      $('.chat-logs-container.nano').nanoScroller({scroll: 'bottom'});
    if (last_log_id && last_log_id == this.data._id) {
      $('#chatlogs-loader:visible').fadeOut();
      Session.set('chatroom_last_log_id');
    }
};

waartaa.chat.helpers.chatLogsTableCreateHandler = function () {
  Meteor.setTimeout(updateHeight, 0);
};

