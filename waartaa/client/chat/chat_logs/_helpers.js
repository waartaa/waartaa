waartaa.chat.helpers.chatLogRowCreateHandler = function () {
    if (Session.get('shallUpdateHeight')) {
      Meteor.setTimeout(updateHeight, 0);
      Session.set('shallUpdateHeight');
    }
    $('.chat-logs-container.nano').nanoScroller();
    var last_log_id = Session.get('chatroom_last_log_id');
    if (last_log_id)
      $('.chat-logs-container.nano').nanoScroller({scroll: 'bottom'});
    if (last_log_id && last_log_id == this.data._id) {
      $('#chatlogs-loader:visible').fadeOut();
      Session.set('chatroom_last_log_id');
    }
};

waartaa.chat.helpers.chatLogsTableCreateHandler = function () {
  Meteor.setTimeout(updateHeight, 0);
};

