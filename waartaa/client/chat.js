updateHeight = function () {
  highlightChannel();
  var body_height = $('body').height();
  var final_height = body_height - 90;
  $('#chat, #chat-main, .chatroom').height(final_height - 23);
  $('#chat-channel-users .panel-body, #chat-servers .panel-body').height(final_height - 75);
  //var topic_height = Session.get('topicHeight') || 0;
  $('.chat-logs-container')//.height(final_height - 69);
  .each(function (index, elem) {
    var $topic = $(elem).prev('.topic');
    $(elem).height((final_height - $topic.height() || 0) - 25);
  });
}

Template.chat_connections.servers = function () {
  return UserServers.find();
}

Template.server_channels.channels = function (server_id) {
  return UserChannels.find({user_server_id: server_id, active: true});
}

Template.chat.rendered = function () {
  $('.content-main').addClass('no-padding');
}

function  highlightChannel () {
  var room_id = Session.get('room_id');
  var server_id = Session.get('server_id');
  $('li.server').removeClass('active');
  $('.server-room').parent().removeClass('active');
  if (Session.get('roomtype') == 'channel')
    $('.server-room#channelLink-' + room_id).parent().addClass('active');
  else if (Session.get('roomtype') == 'pm')
    $('.server-room#pmLink-' + room_id).parent().addClass('active');
  //else if (Session.get('roomtype') == 'server')
  //  $('#server-' + server_id + ' ul.server-link-ul li:first').addClass('active');
  $('li#server-' + server_id).addClass('active');
  $('#chat-input').focus();
  refreshAutocompleteNicksSource();
}

Template.chat_main.chat_logs = function () {
  var room_id = Session.get('room_id');
  if (Session.get('roomtype') == 'channel') {
    return UserChannelLogs.find({channel_id: room_id});
  } else if (Session.get('roomtype') == 'pm') {
    var nick = room_id.substr(room_id.indexOf('-') + 1);
    return PMLogs.find({
      $or: [
        {from: nick, to_user_id: Meteor.user()._id},
        {from_user_id: Meteor.user()._id, to: nick}
      ]
    });
  } else if (Session.get('roomtype') == 'server') {
    var server_id = Session.get('room_id');
    return UserServerLogs.find({server_id: server_id});
  }
}

Template.chat_main.topic = function () {
  try {
    var channel = UserChannels.findOne({_id: Session.get('room_id')});
    if (channel) {
      return channel.topic || "";
    }
  } catch (err) {
    return "";
  }
};

Template.chat_main.rendered = updateHeight;

function observeChatlogTableScroll () {
  var $table = $(this.find('.chatlogs-table'));
  var $container = $table.parent();
  var id = $table.attr('id');
  var old_table_height = Session.get('height-' + id, 0);
  var new_table_height = $table.height();
  if ($container.scrollTop() == 0) {
    console.log(old_table_height);
    console.log(new_table_height);
    $container.scrollTop(new_table_height - old_table_height);
  }
  Session.set('height-' + id, new_table_height);
}

Template.channel_chat_logs_table.rendered = observeChatlogTableScroll;
Template.server_chat_logs_table.rendered = observeChatlogTableScroll;
Template.pm_chat_logs_table.rendered = observeChatlogTableScroll;

Template.chat_row.rendered = function () {};

function chatLogsContainerScrollCallback (event) {
    var scroll_top = $(event.target).scrollTop();
    var $target = $(event.target);
    var $table = $target.find('.chatlogs-table');
    if (scroll_top == 0) {
      console.log("Reached top of page.");
      var key = '';
      if ($table.hasClass('channel'))
        key = "user_channel_log_count_" + $target.data('channel-id');
      else if ($table.hasClass('server'))
        key = "user_server_log_count_" + $target.data('server-id');
      else if ($table.hasClass('pm'))
        key = "pmLogCount-" + $target.data('server-id') + '_' + $target.data('nick');
      var current_count = Session.get(key, 0);
      Session.set('height-' + $table.attr('id'), $table.height());
      Session.set(key, current_count + DEFAULT_LOGS_COUNT);
    }
    var room_id = Session.get('room_id');
    if ((event.target.scrollHeight - scroll_top) <= $(event.target).outerHeight())
      scroll_top = null;
    if (Session.get('roomtype') == 'channel')
      Session.set('scroll_height_channel-' + room_id,
        scroll_top);
    else if (Session.get('roomtype') == 'pm')
      Session.set('scroll_height_' + room_id,
        scroll_top);
    else if (Session.get('roomtype') == 'server')
      Session.set('scroll_height_server-' + Session.get('server_id'),
        scroll_top);
  }

Template.channel_logs.events = {
  'scroll .chat-logs-container': chatLogsContainerScrollCallback
};

Template.server_logs.events = {
  'scroll .chat-logs-container': chatLogsContainerScrollCallback
};

Template.pm_logs.events = {
  'scroll .chat-logs-container': chatLogsContainerScrollCallback
};

function autocompleteNicksInitiate () {
  function split (val) {
    return val.split(/(^|[\ ]+)@/ );
  }

  function extractLast ( term ) {
    return split(term).pop();
  }

  $('#chat-input')
    .bind('keydown', function (event) {
      if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "ui-autocomplete" ).menu.active ) {
          event.preventDefault();
      }
    })
    .autocomplete({
      autoFocus: true,
      minLength: 1,
      source: function( request, response ) {
        // delegate back to autocomplete, but extract the last term
        response( $.ui.autocomplete.filter(
          getChannelNicks(), extractLast( request.term ) ) );
      },
      search: function (event, ui) {
        var $input = $('#chat-input');
        var val = $input.val() || "";
        if (val.split(' ').length == 1 && val.length >= 1 && val[0] != '@')
          return false;
      },
      focus: function() {
        // prevent value inserted on focus
        return false;
      },
      select: function( event, ui ) {
        var terms = split( this.value );
        // remove the current input
        terms.pop();
        // add the selected item
        terms.push( ui.item.value );
        this.value = terms.join( "" );
        if (this.value.length >= 1 && this.value[0] == "")
          this.value = this.value.substr(1);
        return false;
      },
      open: function($event, ui) {
          var $widget = $("ul.ui-autocomplete");
          var $input = $("#chat-input");
          var position = $input.position();

          var top_offset = $widget.find('li').length * 24;
          if (top_offset > 200)
            top_offset = 200;
          $("#chat-input-form").append($widget);
          $widget.width('auto')
            .css('max-height', 200)
            .css('overflow', 'auto')
            .css("left", position.left + $input.val().length * 6)
            .css("bottom", 36)
            .css("top", - top_offset - 2);
      }
    });
}

function refreshAutocompleteNicksSource () {
  $('chat-input').autocomplete('option', 'source', getChannelNicks());
}

function getChannelNicks () {
  var channel_nicks = [];
  var channel = UserChannels.findOne({_id: Session.get('room_id')}) || {};
  for (var nick in channel.nicks || {})
    channel_nicks.push(nick);
  return channel_nicks;
}

function serverRoomSelectHandler (event) {
    var $target = $(event.target);
    if ($target.hasClass('server-room-menu-btn') || $target.parent().hasClass('server-room-menu-btn'))
      return;
    event.stopPropagation();
    $('.dropdown.open, .btn-group.open').removeClass('open');
    var prev_room_id = Session.get('room_id');
    var prefix = '';
    var prev_roomtype = Session.get('roomtype');
    if (prev_roomtype == 'server' || prev_roomtype == 'channel')
      prefix = prev_roomtype + '-';
    Session.set('scroll_height_' + prefix + prev_room_id, $('#chat-logs-container').scrollTop() || null);
    $('.chatroom').hide();
    if ($target.data('roomtype') == 'channel') {
      var server_id = $target.parents('.server').data('server-id');
      Session.set('server_id', server_id);
      Session.set('roomtype', 'channel');
      Session.set('room_id', $(event.target).data('id'));
      channel_nicks = getChannelNicks();
      var selector = '#channel-chatroom-' + $(event.target).data('id');
      $(selector).show();
      Session.set('topicHeight', $(selector + ' .topic').height());
      Session.set('lastAccessedChannel-' + Session.get('room_id'), new Date());
      Session.set('unreadLogsCountChannel-' + Session.get('room_id'), 0);
    } else if ($target.data('roomtype') == 'pm') {
      var server_id = $target.parents('.server').data('server-id');
      Session.set('server_id', server_id);
      Session.set('roomtype', 'pm');
      Session.set('room_id', $target.data('roomid'));
      var selector = '#pmChatroom-' + Session.get('room_id');
      $(selector).show();
      Session.set('topicHeight', $(selector + ' .topic').height());
      Session.set('lastAccessedPm-' + Session.get('room_id'), new Date());
      Session.set('unreadLogsCountPm-' + Session.get('room_id'), 0);

    } else if ($target.data('roomtype') == 'server' || $target.parent().data('roomtype') == 'server') {
      Session.set('room_id', $target.parent().data('server-id') || $target.data('server-id'));
      Session.set('server_id', Session.get('room_id'));
      Session.set('roomtype', 'server');
      var selector = '#server-chatroom-' + Session.get('room_id');
      $(selector).show();
      Session.set('topicHeight', $(selector + ' .topic').height());
      Session.set('lastAccessedServer-' + Session.get('room_id'), new Date());
      Session.set('unreadLogsCountServer-' + Session.get('room_id'), 0);

    }
    if (!$(selector).data('rendered')) {
      $(selector + ' .chat-logs-container').scrollTop($(selector + ' table').height());
      $(selector).data('rendered', true);
    }

    highlightChannel();
} 

Handlebars.registerHelper("isCurrentRoom", function (room_id, room_type, server_id) {
  if (room_id == "ohB9cwuTsTnHMxT7T")
    return true;
  return false;
  /*
  var session_roomtype = Session.get('roomtype');
  var session_room_id = Session.get('room_id');
  var session_server_id = Session.get('server_id');
  if (session_roomtype = room_type && session_room_id == room_id && session_server_id == server_id)
    return true;
  return false;*/
});

Template.chat_connection_server.events({
  'click .server-room': serverRoomSelectHandler,
  'click .server-link': serverRoomSelectHandler
});

Handlebars.registerHelper('pms', function (id) {
  var server = UserServers.findOne({_id: id});
  var user = Meteor.user();
  var pms = [];
  try {
    var pms = user.profile.connections[id].pms;
  } catch (err) {}
  var return_pms = [];
  for (nick in pms)
    return_pms.push({name: nick, server_id: server._id, room_id: server._id + '_' + nick});
  return return_pms;
});

function chatUserClickHandler (event) {
    if ($(event.target).hasClass('btn-group') || $(event.target).parent().hasClass('btn-group'))
      return;
    event.stopPropagation();
    //$('.channel-user').parent().removeClass('active');
    $('.dropdown.open, .btn-group.open').removeClass('open');
    //$(event.target).parent().addClass('active');
}

function serverChannelsRenderedCallback () {
  updateHeight();
}

Template.server_channels.rendered = serverChannelsRenderedCallback;

Template.chat_users.channel_users = function () {
  if (Session.get('roomtype') == 'channel') {
    var channel_id = Session.get('room_id');
    var channel = UserChannels.findOne({_id: channel_id});
    var nicks = {};
    if (channel)
      nicks = channel.nicks || {};
    var nicks_list = [];
    for (var key in nicks)
      nicks_list.push({name: key, status: nicks.key})
    return nicks_list;
  } else
    return [];
};

Template.chat_users.rendered = updateHeight;

Template.server_channel_item.rendered = function () {
  Session.set("lastAccessedChannel-" + this.data._id, new Date());
};

Template.chat_connection_server.rendered = function () {
  Session.set("lastAccessedServer-" + this.data._id, new Date());
};

Template.server_pm_item.rendered = function () {
  Session.set("lastAccessedPm-" + this.data.server_id + '_' + this.data.from);
};

Template.chat_main.rendered = function () {
  setTimeout(function () {
    updateHeight();
    var roomtype = Session.get('roomtype');
    var key = '';
    var room_id = Session.get('room_id');
    if (roomtype == 'channel')
      key = 'scroll_height_channel-' + room_id;
    else if (roomtype == 'pm')
      key = 'scroll_height_' + room_id;
    else if (roomtype == 'server')
      key = 'scroll_height_server-' + room_id;
    var chat_height = Session.get(key);
    //$('#chat-logs-container').scrollTop(chat_height || $('#chat-logs').height());
  }, 0);
};

Template.chat_main.destroyed = function () {
  var roomtype = Session.get('roomtype');
  if (roomtype == 'channel') {
    prefix = roomtype + '-';
    Session.set('scroll_height_' + prefix + Session.get('room_id'), $('#chat-logs-container').scrollTop());
  }
};

Client = {};

Meteor.subscribe("client", Meteor.user() && Meteor.user().username);

Template.chat_input.events({
  'keydown #chat-input': function (e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode == 9)
      e.preventDefault();
  },
  'submit #chat-input-form': function (event) {
    event.preventDefault();
    var $form = $(event.target);
    var $chat_input = $form.find('#chat-input');
    var message = $chat_input.val();
    try {
      var myNick = (Meteor.user().profile.connections[Session.get(
        'server_id')]['client_data'] || {})['nick'] || Meteor.user().username;
    } catch (err) {
      console.log(err);
      var myNick = Meteor.user().username;
    }
    if (!message)
      return;
    $chat_input.val('');
    var prefix = '';
    if (Session.get('roomtype') == 'channel') {
      var room_id = Session.get('room_id');
      var channel = UserChannels.findOne({_id: room_id});
      prefix = 'channel-';
      Meteor.call('send_channel_message', channel._id, message);
    } else if (Session.get('roomtype') == 'pm') {
      var room_id = Session.get('room_id');
      var nick = room_id.substr(room_id.indexOf('_') + 1);
      Meteor.call('send_pm', message, room_id)
    } else if (Session.get('roomtype') == 'server') {
      var room_id = 'server-' + Session.get('server_id');
      prefix = 'server-';
    }
    Session.set('scroll_height_' + prefix + room_id, null);
  }
});

Template.chat_users.events = {
  'click .channel-user': chatUserClickHandler,
};

Template.user_menu.events = {
  'click .pm-user': function (event) {
    var $target = $(event.target);
    var nick = $target.data('user-nick');
    var user = Meteor.user();
    var server_id = Session.get('server_id');
    var profile = user.profile;
    if (!profile) {
      profile = {connections: {}};
      profile.connections[server_id] = {pms: {}};
    }
    if (!profile.connections[server_id].pms)
      profile.connections[server_id].pms = {};
    profile.connections[server_id].pms[nick] = '';
    Meteor.users.update({_id: user._id}, {$set: {profile: profile}});
    Session.set('roomtype', 'pm');
    Session.set('room_id', Session.get('server_id') + '-' + nick);
  },
};

Template.chat_input.rendered = function () {
  autocompleteNicksInitiate();
}

Template.channel_menu.events = {
  'click .channel-remove': function (e) {
    var channel_id = $(e.target).data("channel-id");
    var channel = UserChannels.findOne({_id: channel_id});
    Meteor.call("part_user_channel", channel.user_server_name, channel.name);
  }
}

Template.server_pm_menu.events = {
  'click .pm-remove': function (e) {
    var user = Meteor.user();
    var $target = $(e.target);
    var pm_id = $(e.target).parents('li').find(
      '.pm.server-room').attr('id');
    var user_server_id = $target.data('server-id');
    var nick = $target.data('user-nick');
    var profile = user.profile;
    var pms = user.profile.connections[user_server_id].pms;
    delete pms[nick];
    Meteor.users.update({_id: user._id}, {$set: {profile: profile}});
  }
}

Template.channel_menu.events = {
  'click .channel-remove': function (e) {
    var $target = $(e.target);
    var channel_id = $target.data('channel-id');
    var channel = UserChannels.findOne({_id: channel_id});
    Meteor.call(
      'send_command', channel.user_server_name, '/part ' + channel.name);
  }
}

Template.channel_logs.rendered = function () {
  console.log("CREATED channel_logs");
};

Handlebars.registerHelper("activeChannels", function () {
  return UserChannels.find({active: true});
});

Handlebars.registerHelper("activeServers", function () {
  return UserServers.find();
});

cursors_observed = {};

function updateUnreadLogsCount (
    unread_logs_count_key, last_accessed_key, last_updated) {
  var last_accessed = Session.get(last_accessed_key);
  if (last_updated > last_accessed) {
    var unread_logs_count = Session.get(unread_logs_count_key) || 0;
    unread_logs_count += 1;
    Session.set(unread_logs_count_key, unread_logs_count);
  }
}

Handlebars.registerHelper("channelChatLogs", function (channel_id) {
  var cursor = UserChannelLogs.find({channel_id: channel_id}, {sort: {created: 1}});
  var session_key = 'unreadLogsCountChannel-' + channel_id;
  cursor.observeChanges({
    added: function (id, fields) {
      Deps.nonreactive(function () {
        updateUnreadLogsCount(
          session_key, 'lastAccessedChannel-' + fields.channel_id,
          fields.last_updated)
      });
    }
  });
  return cursor;
});

Handlebars.registerHelper("serverChatLogs", function (server_id) {
  var cursor = UserServerLogs.find({server_id: server_id});
  var session_key = 'unreadLogsCountServer_' + server_id;
  cursor.observeChanges({
    added: function (id, fields) {
      Deps.nonreactive(function () {
        updateUnreadLogsCount(
          session_key, 'lastAccessedServer-' + fields.server_id,
          fields.last_updated)
      });
    }
  });
  return cursor;
});

Handlebars.registerHelper("pmChatLogs", function (server_id, nick) {
  var cursor = PMLogs.find({
    $or: [{from: nick}, {to_nick: nick}], server_id: server_id});
  var session_key = "unreadLogsCountPm-" + server_id + '_' + nick;
  cursor.observeChanges({
    added: function (id, fields) {
      Deps.nonreactive(function () {
        updateUnreadLogsCount(
          session_key, 'lastAccessedPm-' + fields.server_id + '_' + nick,
          fields.last_updated);
      });
    }
  });
  return cursor;
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

$('.whois-tooltip').tipsy({live: true, gravity: 'e', html: true});
$('#server-add-btn.enable-tipsy').tipsy({live: true, gravity: 's'});
function _get_nick_whois_data (nick) {
  var user_server_id = Session.get('server_id');
  return UserServerUsers.findOne({
    nick: nick, user_server_id: user_server_id});


}

Handlebars.registerHelper('whois_tooltip', function (nick) {
  var tooltip = "";
  var whois_data = _get_nick_whois_data(nick);
  if (whois_data)
    tooltip = "Username: " + whois_data.user + "<br/>" +
      "Real name: " + whois_data.realname + "<br/>" +
      "Server: " + whois_data.server + "<br/>";
  console.log(tooltip);
  return new Handlebars.SafeString(tooltip);
});

Handlebars.registerHelper('is_user_away', function (nick) {
  var whois_data = _get_nick_whois_data(nick);
  if (whois_data && whois_data.away)
    return true;
  return false;
});

