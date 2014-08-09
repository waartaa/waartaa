waartaa.chat.helpers.chatLogRowCreateHandler = function () {
    if (Session.get('shallUpdateHeight')) {
      Meteor.setTimeout(updateHeight, 0);
      Session.set('shallUpdateHeight');
    }
    var current_oldest_log_id_in_room = Session.get('oldest_log_id_in_room');
};

waartaa.chat.helpers.chatLogsTableCreateHandler = function () {
  Meteor.setTimeout(updateHeight, 0);
};

waartaa.chat.helpers.chatLogsWaypointHandler = function () {
  var $scrollUpElem = null;
  var $scrollDownElem = null;
  return function () {
    if ($scrollUpElem)
      $scrollUpElem.waypoint('destroy');
    if ($scrollDownElem)
      $scrollDownElem.waypoint('destroy');
    $scrollUpElem = $('.chatlogs-scroll-up')
      .waypoint(function (direction) {
        console.log(direction);
      }, {
        context: '.chat-logs-container',
        offset: -10
      });
    $scrollDownElem = $('.chatlogs-scroll-down')
      .waypoint(function (direction) {
        console.log(direction);
      }, {
        context: '.chat-logs-container',
        offset: $('.chat-logs-container').outerHeight()
      });
  };
}();

waartaa.chat.helpers.chatLogRowRenderedHandler = function () {
  var last_log_id = Session.get('chatroom_last_log_id');
  var current_oldest_log_in_room = Session.get('oldest_log_in_room');
  if (last_log_id && last_log_id == this.data._id) {
    $('#chatlogs-loader:visible').fadeOut();
    Session.set('chatroom_last_log_id');
    updateHeight();
    if ( Session.get('scrollAtBottom') != false )
      $('.chat-logs-container').scrollTop($('.chatlogs-table').height());
  }
}

waartaa.chat.helpers.chatLogsContainerRendered = function () {
  updateHeight();
  $('.chat-logs-container').scrollTop($('.chatlogs-table').height());
}
