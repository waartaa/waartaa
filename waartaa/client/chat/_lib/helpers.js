/**
 * Namespace for helper functions for chat interface.
 */
waartaa.chat.helpers = {};

waartaa.chat.helpers.chatLogsContainerScrollCallback = function (event) {
  var scroll_top = $(event.target).scrollTop();
  var $target = $(event.target);
  var $table = $target.find('.chatlogs-table');
  $table.off('scrolltop');
  console.log("Reached top of page.");
  var key = '';
  if ($table.hasClass('channel'))
    key = "user_channel_log_count_" + $target.data('channel-id');
  else if ($table.hasClass('server'))
    key = "user_server_log_count_" + $target.data('server-id');
  else if ($table.hasClass('pm'))
    key = "pmLogCount-" + $target.data('server-id') + '_' + $target.data('nick');
  var current_count = Session.get(key, 0);
  Session.set('height-' + $table.attr('id'), $table.find('.chatlogrows').height());
  console.log('current table height: ' + Session.get('height-' + $table.attr('id')));
  var room_id = Session.get('room_id');
  if ((event.target.scrollHeight - scroll_top) <= $(event.target).outerHeight())
    scroll_top = null;
  var roomtype = Session.get('roomtype');
  if (roomtype == 'channel')
    Session.set('scroll_height_channel-' + room_id,
      scroll_top);
  else if (roomtype == 'pm')
    Session.set('scroll_height_' + room_id,
      scroll_top);
  else if (roomtype == 'server')
    Session.set('scroll_height_server-' + Session.get('server_id'),
      scroll_top);
  Session.set(key, current_count + DEFAULT_LOGS_COUNT);
}

/**
 * [Reactive] Higlight currently selected server room.
 */
waartaa.chat.helpers.highlightServerRoom = function () {
  var room = Session.get('room') || {};
  $('li.server').removeClass('active');
  $('.server-room').parent().removeClass('active');
  var selector = '';
  if (room.roomtype == 'channel') {
    $('.server-room#channelLink-' + room.room_id).parent().addClass('active');
    selector = '#channel-chatroom-' + room.room_id;
  } else if (room.roomtype == 'pm') {
    $('#pmLink-' + room_id + '.server-room').parent().addClass('active');
    selector = '#pmChatroom-' + room.room_id;
  } else if (room.roomtype == 'server') {
    selector = '#server-chatroom-' + room.server_id;
  }
  $('.chatroom').hide();
  var $selector = $(selector);
  $selector.show();
  if (room.roomtype == 'channel') {
      Session.set('topicHeight', $(selector + ' .topic').height());
      Session.set('lastAccessedChannel-' + room.room_id, new Date());
      Session.set('unreadLogsCountChannel-' + room.room_id, 0);
  } else if (room.roomtype == 'pm') {
      Session.set('topicHeight', $(selector + ' .topic').height());
      Session.set('lastAccessedPm-' + room.room_id, new Date());
      Session.set('unreadLogsCountPm-' + room.room_id, 0);
  } else if (room.roomtype == 'server') {
      Session.set('topicHeight', $(selector + ' .topic').height());
      Session.set('lastAccessedServer-' + room.room_id, new Date());
      Session.set('unreadLogsCountServer-' + room.room_id, 0);
  }
  //refreshAutocompleteNicksSource();
  //$(selector).find('.nano').nanoScroller();
  $selector.off('scrolltop').on('scrolltop', waartaa.chat.helpers.chatLogsContainerScrollCallback);
  if (!$(selector).data('rendered')) {
    $(selector).data('rendered', true);
    $(selector + ' .chat-logs-container').nanoScroller({scroll: 'bottom'});
  } else if ($selector.find('.pane').length == 0)
    $(selector + ' .chat-logs-container').nanoScroller({scroll: 'bottom'});
  else if ($selector.find('.chatlogrows').height() > $selector.find(
        '#channel-chat-logs-'+room_id).height())
     $(selector + ' .chat-logs-container').nanoScroller();
};

/**
 * Sets the current room obj in Session against the key 'room'.
 * @param {object} obj This is an object holding attributes of the
 *     currently selected room.
 */
waartaa.chat.helpers.setCurrentRoom = function (obj) {
  if (obj.roomtype == 'server')
    Session.set('room', {
      room_id: obj.server_id,
      roomtype: obj.roomtype,
      server_id: obj.server_id,
      server_name: obj.server_name,
    });
  else if (obj.roomtype == 'channel')
    Session.set('room', {
      room_id: obj.channel_id,
      roomtype: obj.roomtype,
      server_id: obj.server_id,
      server_name: obj.server_name,
      channel_id: obj.channel_id,
      channel_name: obj.channel_name
    });
  else if (obj.roomtype == 'pm')
    Session.set('room', {
      room_id: obj.server_id + '_' + obj.nick,
      roomtype: 'pm',
      server_id: obj.server_id,
      server_name: obj.server_name,
      nick: obj.nick
    });
  else
    Session.set('room', {});
};

waartaa.chat.helpers.refreshAutocompleteNicksSource = function () {

};

waartaa.chat.helpers.LINK_REGEX = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/g;

Handlebars.registerHelper('isCurrentRoomtype', function (roomtype) {
  if ((Session.get('room') || {}).roomtype == roomtype)
    return true;
  return false;
});

Handlebars.registerHelper("unread_logs_count", function (
    room_type, room_id, nick) {
  if (room_type == "pm")
    room_id = room_id + '_' + nick;
  var room_type = room_type[0].toUpperCase() + room_type.substr(1);
  var key = "unreadLogsCount" + room_type + "-" + room_id;
  var count = Session.get(key);
  if (count > 0 && Session.get('room_id') != room_id)
    return count;
  else {
    Session.set(key, 0);
    return '';
  }
});
