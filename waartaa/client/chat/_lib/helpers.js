/**
 * Namespace for helper functions for chat interface.
 */
waartaa.chat.helpers = {};

waartaa.chat.helpers.chatLogsContainerScrollCallback = function (event) {
  var scroll_top = $(event.target).scrollTop();
  var $target = $(event.target);
  var $table = $target.find('.chatlogs-table');
  $table.off('scrolltop');
  $('.chatlogs-loader-msg').show();
  Meteor.setTimeout(function () {
    $('.chatlogs-loader-msg').fadeOut(1000);
  }, 3000);
  var key = '';
  if ($table.hasClass('channel'))
    key = "user_channel_log_count_" + $target.data('channel-id');
  else if ($table.hasClass('server'))
    key = "user_server_log_count_" + $target.data('server-id');
  else if ($table.hasClass('pm'))
    key = "pmLogCount-" + $target.data('server-id') + '_' + $target.data('nick');
  var current_count = Session.get(key, 0);
  Session.set('height-' + $table.attr('id'), $table.find('.chatlogrows').height());
  var room = Session.get('room');
  if ((event.target.scrollHeight - scroll_top) <= $(event.target).outerHeight())
    scroll_top = null;
  if (room.roomtype == 'channel')
    Session.set('scroll_height_channel-' + room.room_id,
      scroll_top);
  else if (room.roomtype == 'pm')
    Session.set('scroll_height_' + room.room_id,
      scroll_top);
  else if (room.roomtype == 'server')
    Session.set('scroll_height_server-' + room.server_id,
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
  if (room.roomtype == 'channel') {
    $('.server-room#channelLink-' + room.room_id).parent().addClass('active');
  } else if (room.roomtype == 'pm') {
    $('#pmLink-' + room.room_id + '.server-room').parent().addClass('active');
  } else if (room.roomtype == 'server')
    $('#serverLink-' + room.server_id).parent().addClass('active');
  if (room.roomtype == 'channel') {
      Session.set('topicHeight', $('#chat-main .topic').height());
      Session.set('lastAccessedChannel-' + room.room_id, new Date());
      Session.set('unreadLogsCountChannel-' + room.room_id, 0);
  } else if (room.roomtype == 'pm') {
      Session.set('topicHeight', $('#chat-main .topic').height());
      Session.set('lastAccessedPm-' + room.room_id, new Date());
      Session.set('unreadLogsCountPm-' + room.room_id, 0);
  } else if (room.roomtype == 'server') {
      Session.set('topicHeight', $('#chat-main .topic').height());
      Session.set('lastAccessedServer-' + room.room_id, new Date());
      Session.set('unreadLogsCountServer-' + room.room_id, 0);
  }
  $('#chat-input').focus();
  //refreshAutocompleteNicksSource();
  Meteor.setTimeout(function () {
    $('#chat-main .nano').nanoScroller({scroll: 'bottom'})
    .off('scrolltop')
    .on('scrolltop', waartaa.chat.helpers.chatLogsContainerScrollCallback);
  }, 1000);
};

/**
 * Sets the current room obj in Session against the key 'room'.
 * @param {object} obj This is an object holding attributes of the
 *     currently selected room.
 */
waartaa.chat.helpers.setCurrentRoom = function (obj) {
  var set_cookie = function(key, value) {
    document.cookie = key + '=' + value;
  };

  set_cookie('userId', Meteor.userId());
  set_cookie('roomtype', obj.roomtype);

  if (obj.roomtype == 'server') {
    Session.set('room', {
      room_id: obj.server_id,
      roomtype: obj.roomtype,
      server_id: obj.server_id,
      server_name: obj.server_name,
    });
    // set cookie server_id
    set_cookie('server_id', obj.server_id);
  }
  else if (obj.roomtype == 'channel') {
    Session.set('room', {
      room_id: obj.channel_id,
      roomtype: obj.roomtype,
      server_id: obj.server_id,
      server_name: obj.server_name,
      channel_id: obj.channel_id,
      channel_name: obj.channel_name
    });
    // set cookie server_id and channel_id
    set_cookie('server_id', obj.server_id);
    set_cookie('channel_id', obj.channel_id);
  }
  else if (obj.roomtype == 'pm') {
    Session.set('room', {
      room_id: obj.server_id + '_' + obj.nick,
      roomtype: 'pm',
      server_id: obj.server_id,
      server_name: obj.server_name,
      nick: obj.nick
    });
    // set cookie pm_nick
    set_cookie('server_id', obj.server_id);
    set_cookie('pm_nick', obj.nick);

  }
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

Handlebars.registerHelper('isAnyRoomSelected', function () {
  if (Session.get('room'))
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

Handlebars.registerHelper("unread_mentions_count", function (
    channel_id, nick) {
  var key = "unreadMentionsCountChannel-" + channel_id;
  var room = Session.get('room');
  var count = Session.get(key);
  if (count > 0 && room.room_id != channel_id)
    return count;
  else {
    Session.set(key, 0);
    return '';
  }
});

updateHeight = function () {
  var body_height = $('body').height();
  var final_height = body_height - 90;
  $('#chat, #chat-main, .chatroom').height(final_height - 23);
  $('#info-panel .panel-body, #chat-servers .panel-body').height(final_height - 75);
  $('#info-panel .inner-container').css('min-height', final_height);
  $('.chatlogrows').css('min-height', final_height - 22);
  //var topic_height = Session.get('topicHeight') || 0;
  $('.chat-logs-container')//.height(final_height - 69);
  .each(function (index, elem) {
    var $topic = $(elem).prev('.topic');
    $(elem).height((final_height - $topic.height() || 0) - 25);
  });
};

Handlebars.registerHelper('current_server_id', function () {
  var room = Session.get('room') || {};
  return room.server_id;
});

Handlebars.registerHelper('limitStr', function (text, limit) {
  var final_text = text;
  if (text.length > limit) {
    final_text = text.substr(0, limit - 3) + '...';
  }
  return final_text;
});

Handlebars.registerHelper('isChatMessageNew', function (status) {
  if (status == 'new')
    return true;
  return false;
});

/**
 * Check if window in focus or not
 */
window_focus = true;
$(window).focus(function() {
  window_focus = true;
}).blur(function() {
  window_focus = false;
});
