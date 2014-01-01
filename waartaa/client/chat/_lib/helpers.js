/**
 * Namespace for helper functions for chat interface.
 */
waartaa.chat.helpers = {};

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
  $selector.off('scrolltop').on('scrolltop', chatLogsContainerScrollCallback);
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
