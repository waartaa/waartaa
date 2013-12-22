updateHeight = function () {
  var body_height = $('body').height();
  var final_height = body_height - 90;
  $('#chat, #chat-main, .chatroom').height(final_height - 23);
  $('#info-panel .panel-body, #chat-servers .panel-body').height(final_height - 75);
  $('#info-panel .inner-container').css('min-height', final_height);
  //var topic_height = Session.get('topicHeight') || 0;
  $('.chat-logs-container')//.height(final_height - 69);
  .each(function (index, elem) {
    var $topic = $(elem).prev('.topic');
    $(elem).height((final_height - $topic.height() || 0) - 25);
  });
  highlightChannel();
}

Template.chat_connections.servers = function () {
  return UserServers.find();
}

Template.server_channels.channels = function (server_id) {
  return UserChannels.find(
    {user_server_id: server_id, active: true}, {sort: {name: 1}});
}

Template.chat.rendered = function () {
  $('.content-main').addClass('no-padding');
}

Template._loginButtonsLoggedInDropdown.created = function () {
  NProgress.start();
}

Template.add_server_modal.created = function () {
  NProgress.done();
}

function highlightChannel () {
  var room_id = Session.get('room_id');
  var server_id = Session.get('server_id');
  var roomtype = Session.get('roomtype');
  $('li.server').removeClass('active');
  $('.server-room').parent().removeClass('active');
  var selector = '';
  if (roomtype == 'channel') {
    $('.server-room#channelLink-' + room_id).parent().addClass('active');
    selector = '#channel-chatroom-' + room_id;
  } else if (roomtype == 'pm') {
    $('#pmLink-' + room_id + '.server-room').parent().addClass('active');
    selector = '#pmChatroom-' + room_id;
  } else if (roomtype == 'server') {
    selector = '#server-chatroom-' + server_id;
  }
  $('.chatroom').hide();
  $(selector).show();
  if (roomtype == 'channel') {
      Session.set('topicHeight', $(selector + ' .topic').height());
      Session.set('lastAccessedChannel-' + room_id, new Date());
      Session.set('unreadLogsCountChannel-' + room_id, 0);
      $('.info-panel-item.active').removeClass('active');
      $('#channel-users-' + room_id).addClass('active');
  } else if (roomtype == 'pm') {
      Session.set('topicHeight', $(selector + ' .topic').height());
      Session.set('lastAccessedPm-' + room_id, new Date());
      Session.set('unreadLogsCountPm-' + room_id, 0);
      $('.info-panel-item.active').removeClass('active');
  } else if (roomtype == 'server') {
      Session.set('topicHeight', $(selector + ' .topic').height());
      Session.set('lastAccessedServer-' + room_id, new Date());
      Session.set('unreadLogsCountServer-' + room_id, 0);
      $('.info-panel-item.active').removeClass('active');
  }
  //  $('#server-' + server_id + ' ul.server-link-ul li:first').addClass('active');
  $('li#server-' + server_id).addClass('active');
  //$('#chat-input').focus();
  $('#chat-input').focus();
  refreshAutocompleteNicksSource();
  //$(selector).find('.nano').nanoScroller();
  $(selector).off('scrolltop').on('scrolltop', chatLogsContainerScrollCallback);
  $(selector + ' .chat-logs-container').nanoScroller();
  if (!$(selector).data('rendered')) {
    $(selector).data('rendered', true);
    $(selector + ' .chat-logs-container').nanoScroller({
      scrollTop: $(selector + ' .chatlogrows').height()});
  }
}

Deps.autorun(highlightChannel);

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
      var channel_id = $(event.target).data('id');
      Session.set('server_id', server_id);
      Session.set('roomtype', 'channel');
      Session.set('room_id', channel_id);
    } else if ($target.data('roomtype') == 'pm') {
      var server_id = $target.parents('.server').data('server-id');
      Session.set('server_id', server_id);
      Session.set('roomtype', 'pm');
      Session.set('room_id', $target.data('roomid'));
    } else if ($target.data('roomtype') == 'server' || $target.parent().data('roomtype') == 'server') {
      Session.set('room_id', $target.parent().data('server-id') || $target.data('server-id'));
      Session.set('server_id', Session.get('room_id'));
      Session.set('roomtype', 'server');
    }
    highlightChannel();
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
  var new_table_height = $table.find('.chatlogrows').height();
  if (Session.get('scrollStart-' + id) && $container.scrollTop() == 0 && new_table_height > old_table_height) {
    $container.nanoScroller({scrollTop: (new_table_height - old_table_height)});
    Session.set('scrollStart-' + id);
  }
  Session.set('height-' + id, new_table_height);
  Meteor.setTimeout(function () {
    $table.on('scrolltop', chatLogsContainerScrollCallback);
  }, 2000);
}

Template.channel_chat_logs_table.rendered = observeChatlogTableScroll;
Template.server_chat_logs_table.rendered = observeChatlogTableScroll;
Template.pm_chat_logs_table.rendered = observeChatlogTableScroll;

Template.chat_row.rendered = function () {};

function chatLogsContainerScrollCallback (event) {
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
    Session.set('scrollStart-' + $table.attr('id'), true);
  }

Template.channel_logs.events = {
  'scrolltop .chat-logs-container': chatLogsContainerScrollCallback
};

Template.server_logs.events = {
  'scroll .chat-logs-container': chatLogsContainerScrollCallback
};

Template.pm_logs.events = {
  'scroll .chat-logs-container': chatLogsContainerScrollCallback
};

function _getMatchingNicks (term) {
  var nicks = [];
  console.log(term);
  var channel = null;
  if (Session.get('roomtype') == 'channel') {
    channel = UserChannels.findOne({_id: Session.get('room_id')});
  }
  if (!channel)
    return;
  ChannelNicks.find(
    {
      nick: {$regex: '^' + term + '.+'},
      channel_name: channel.name,
      server_name: channel.user_server_name
    },
    {nick: 1}
  ).forEach(function (nick) {
    nicks.push(nick.nick);
  });
  console.log(nicks);
  return nicks;
}

function autocompleteNicksInitiate () {
  function split (val) {
    return val.split(/(^|[\ ]+)/ );
  }

  function extractLast ( term ) {
    return split(term).pop();
  }

  var auto_suggest = false;

  $('#chat-input')
    .bind('keydown', function (event) {
      if (Session.get('roomtype') != 'channel')
        return;
      if (event.keyCode === $.ui.keyCode.TAB) {
        event.preventDefault();
        if ($( this ).data( "ui-autocomplete" ).menu.active)
          return;
        auto_suggest = true;
        $('#chat-input').autocomplete('search', extractLast($(event.target).val()));
      } else if (event.keyCode === $.ui.keyCode.SPACE)
        auto_suggest = false;
    })
    .autocomplete({
      autoFocus: true,
      minLength: 1,
      source: function( request, response ) {
        // delegate back to autocomplete, but extract the last term
        response( $.ui.autocomplete.filter(
          _getMatchingNicks(request.term), extractLast( request.term ) ) );
      },
      search: function (event, ui) {
        console.log(event);
        var $input = $('#chat-input');
        var val = $input.val() || "";
        console.log(auto_suggest);
        return auto_suggest;
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
  $('chat-input').autocomplete('option', 'source', []);
}

function getChannelNicks () {
  var channel_nicks = [];
  var channel = UserChannels.findOne({_id: Session.get('room_id')}, {name: 1, user_server_name: 1}) || {};
  ChannelNicks.find({
    server_name: channel.user_server_name, channel_name: channel.name
  }).forEach(function (channel_nick) {
    channel_nicks.push(channel_nick.nick);
  });
  return channel_nicks;
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
  $('#chat-servers .nano').nanoScroller();
  updateHeight();
}

Template.server_channels.rendered = serverChannelsRenderedCallback;

Handlebars.registerHelper('channel_users', function (id) {
  var channel_id = id;
  var channel = UserChannels.findOne({_id: channel_id});
  if (!channel)
    return;
  var query = {
    channel_name: channel.name, server_name: channel.user_server_name};
  var last_nick = Session.get(
    'lastNick-' + channel.user_server_name + '_' + channel.name);
  if (last_nick)
    query['nick'] = {$gt: last_nick};
  return ChannelNicks.find(
    query,
    {fields: {nick: 1}, sort: {nick: 1}});
});

Template.chat_users.rendered = updateHeight;

Template.info_panel_body.rendered = function () {
  $('#info-panel .nano').nanoScroller();
}

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
      var user_server = UserServers.findOne(
        {_id: Session.get('server_id')}, {});
      var myNick = user_server.current_nick;
    } catch (err) {
      //console.log(err);
      var myNick = Meteor.user().username;
    }
    if (!message)
      return;
    $chat_input.val('');
    var log_options = {
      room_id: Session.get('room_id'),
      roomtype: Session.get('roomtype'),
      logInput: true
    };
    var prefix = '';
    if (Session.get('roomtype') == 'channel') {
      var room_id = Session.get('room_id');
      var channel = UserChannels.findOne({_id: room_id});
      prefix = 'channel-';
      Meteor.call('send_channel_message', channel._id, message, log_options);
    } else if (Session.get('roomtype') == 'pm') {
      var room_id = Session.get('room_id');
      console.log(room_id);
      var nick = room_id.substr(room_id.indexOf('_') + 1);
      Meteor.call('send_pm', message, room_id, log_options)
    } else if (Session.get('roomtype') == 'server') {
      var room_id = 'server-' + Session.get('server_id');
      prefix = 'server-';
      Meteor.call(
        'send_server_message', Session.get('room_id'), message, log_options);
    }
    var scrollStartKey = Session.get('roomtype') + '-' + 'chat-logs-' + Session.get('room_id');
    Session.set(scrollStartKey);
    //Session.set('scroll_height_' + prefix + room_id, null);
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
    var server_id = $target.parents('.info-panel-item').data('server-id');
    var profile = user.profile;
    if (!profile)
      profile = {connections: {}};
    if (!profile.connections[server_id])
      profile.connections[server_id] = {pms: {}};
    if (!profile.connections[server_id].pms)
      profile.connections[server_id].pms = {};
    profile.connections[server_id].pms[nick] = '';
    console.log(profile);
    Meteor.users.update({_id: user._id}, {$set: {profile: profile}});
    $('.info-panel-item.active').removeClass('active');
    Session.set('roomtype', 'pm');
    Session.set('room_id', server_id + '_' + nick);
  },
  'click .whois-user': function (event) {
    var $target = $(event.target);
    var nick = $target.data('user-nick');
    var user = Meteor.user();
    var server_id = $target.parents('.info-panel-item').data('server-id');
    var server = UserServers.findOne({_id: server_id});
    var roomtype = Session.get('roomtype');
    var room_id = Session.get('room_id');
    Meteor.call(
      'send_command', server.name, '/WHOIS ' + nick, {
        room_id: room_id,
        roomtype: roomtype
    });
  }
};

Template.chat_input.rendered = function () {
  autocompleteNicksInitiate();
}

Template.channel_menu.events = {
  'click .channel-remove': function (e) {
    var channel_id = $(e.target).data("channel-id");
    var channel = UserChannels.findOne({_id: channel_id});
    Meteor.call(
      "part_user_channel", channel.user_server_name, channel.name, true);
  },
  'click .editServerChannelLink': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $this = $(e.target);
    var channel_id = $this.data('channel-id');
    Session.set('channel_id_to_edit', channel_id);
    var $modal_content = $('#editServerChannel-' + channel_id);
    Meteor.setTimeout(function () {
      $modal_content.modal().on(
        'shown.bs.modal', function (e) {
          $modal_content.find('[name="password"]').focus();
        })
        .on('hidden.bs.modal', function (e) {
          $('#chat-input').focus();
        })
      ;
    }, 4);
  },
  'click .toggleJoinChannel': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $this = $(e.target);
    var channel_id = $this.data('channel-id');
    var channel = UserChannels.findOne({_id: channel_id});
    var status = $this.data('status');
    if (status == 'connected')
      Meteor.call(
        "part_user_channel", channel.user_server_name, channel.name, false);
    else
      Meteor.call('join_user_channel', channel.user_server_name, channel.name);
  }
}

//$('.editServerChannelLink').live('click', _handleServerChannelEditLinkClick);

Template.channel_menu.rendered = function (e) {
  //Template.channel_menu.events[
  //  'click .editServerChannelLink'] =  _handleServerChannelEditLinkClick;
}

Handlebars.registerHelper('channel_to_edit', function (e) {
  var channel = UserChannels.findOne({_id: Session.get('channel_id_to_edit')});
  if (channel) {
    channel.password = channel.password || '';
    return channel;
  }
})

Template.edit_server_channel.events = {
  'submit .editServerChannel': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $form = $(e.target);
    var data = {'password': $form.find('[name="password"]').val() || ''};
    Meteor.call('edit_user_channel', $form.data('channel-id'), data, function (err) {
      console.log(err);
      $form.parents('.modal').modal('hide');
    })
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

Template.channel_logs.rendered = function () {
  //console.log("CREATED channel_logs");
};


Template.add_server_modal.events({
  'submit form': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var data = {
      server_id: $('#server-join-server-list').val(),
      nick: $('#server-join-nick').val(),
      real_name: $('#server-join-name').val(),
      password: $('#server-join-password').val(),
      channels: $('#server-join-channels').val()
    };
    console.log(data);
    Meteor.call('user_server_create', data, function (err) {
      console.log(err);
      if (!err)
        $('#addServerModal').modal('hide');
    });
  },
});

$('#addServerModal').on('shown.bs.modal', function (e) {
  $('#addServerModal').find('[name="nick"]').focus();
});

Template.edit_server_modal.events({
  'submit form': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $form = $(e.target);
    var server_id = $form.parents('.modal').data('server-id');
    var data = {};
    $.each($form.serializeArray(), function (index, value) {
      data[value.name] = value.value;
    })
    console.log(data);
    Meteor.call('user_server_create', data, function (err) {
      console.log(err);
      $('#editServerModal-' + server_id).modal('hide');
    })
  }
});

Template.add_server_channel.events({
  'submit form': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $form = $(e.target);
    var data = {};
    var server_id = $form.parents('.modal').data('server-id');
    $.each($form.serializeArray(), function (index, value) {
      data[value.name] = value.value;
    });
    var server = UserServers.findOne({_id: server_id});
    Meteor.call('join_user_channel', server.name, data.name, data.password);
    var $modal_content = $('#addServerChannel-' + server_id);
    $modal_content.modal('hide');
  }
});

Template.server_menu.events({
  'click .serverEditLink': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $this = $(e.target);
    var server_id = $this.data('server-id');
    var $modal_content = $('#editServerModal-' + server_id);
    $modal_content.modal().on('shown.bs.modal', function (e) {
      $modal_content.find('[name="nick"]').focus();
    })
    .on('hidden.bs.modal', function (e) {
      $('#chat-input').focus();
    });
  },
  'click .addChannelLink': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $this = $(e.target);
    var server_id = $this.data('server-id');
    var $modal_content = $('#addServerChannel-' + server_id);
    $modal_content.modal().on('shown.bs.modal', function (e) {
      $modal_content.find('input[name="name"]').focus();
    })
    .on('hidden.bs.modal', function (e) {
      $('#chat-input').focus();
    });
  },
  'click .server-remove': function (e) {
    var server_id = $(e.target).data("server-id");
    var server = UserServers.findOne({_id: server_id});
    Meteor.call(
      "quit_user_server", server.name, true);
  },
  'click .toggleJoinServer': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $this = $(e.target);
    var server_id = $this.data('server-id');
    var server = UserServers.findOne({_id: server_id});
    if (!server)
      return;
    var status = $this.data('status');
    if (status == 'connected')
      Meteor.call(
        "quit_user_server", server.name, false);
    else
      Meteor.call('join_user_server', server.name);
  }
});

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
  var count = 0;
  if (last_updated > last_accessed) {
    var unread_logs_count = Session.get(unread_logs_count_key) || 0;
    unread_logs_count += 1;
    count += 1;
    Session.set(unread_logs_count_key, unread_logs_count);
  }
  return count;
}

var focussed = true;

window.onfocus = function () {
  focussed = true;
};

window.onblur = function () {
  focussed = false;
}

Handlebars.registerHelper("channelChatLogs", function (channel_id) {
  var cursor = UserChannelLogs.find({channel_id: channel_id}, {sort: {created: 1}});
  var session_key = 'unreadLogsCountChannel-' + channel_id;
  cursor.observeChanges({
    added: function (id, fields) {
      Deps.nonreactive(function () {
        var new_logs = updateUnreadLogsCount(
          session_key, 'lastAccessedChannel-' + fields.channel_id,
          fields.last_updated);
        var user_server = UserServers.findOne({_id: fields.server_id});
        if (!user_server)
          return;
        if (
          new_logs > 0 &&
          fields.message.search(user_server.current_nick) >= 0 &&
          (
            (Session.get('roomtype') == 'channel' &&
              Session.get('room_id') != fields.channel_id) ||
            Session.get('roomtype') != 'channel')
          ) {
            var alert_message = fields.server_name + fields.channel_name + ': ' + fields.message;
            $.titleAlert(alert_message, {
              requireBlur:true,
              stopOnFocus:true,
              duration:10000,
              interval:500
            });
          $('#audio-notification')[0].play();
        }
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
        new_logs = updateUnreadLogsCount(
          session_key, 'lastAccessedPm-' + fields.server_id + '_' + nick,
          fields.last_updated);
        if (
            new_logs > 0 &&
            Session.get('room_id') != fields.server_id + '_' + nick) {
          var alert_message = nick + ' messaged you: ' + fields.message;
          $.titleAlert(alert_message, {
            requireBlur:true,
            stopOnFocus:true,
            duration:10000,
            interval:500
          });
          $('#audio-notification')[0].play();
        }
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

Handlebars.registerHelper("server_current_nick", function () {
  var user_server = UserServers.findOne({_id: Session.get('server_id')});
  if (user_server) {
    return user_server.current_nick;
  }
})

$('.whois-tooltip, .tipsy-enable').tipsy({live: true, gravity: 'e', html: true});
$('#server-add-btn.enable-tipsy').tipsy({live: true, gravity: 's'});

function _get_nick_whois_data (nick, user_server_id) {
  var user_server = UserServers.findOne({_id: user_server_id});
  if (!user_server)
    return;
  return ServerNicks.findOne({
    nick: nick, server_id: user_server.server_id});
}

Handlebars.registerHelper('whois_tooltip', function (nick, server_name) {
  var tooltip = "";
  var server_id = (UserServers.findOne({name: server_name}, {_id: 1}) || {})._id;
  var whois_data = _get_nick_whois_data(nick, server_id);
  if (whois_data)
    tooltip = "Username: " + _.escape(whois_data.user) + "<br/>" +
      "Real name: " + _.escape(whois_data.realname) + "<br/>" +
      "Server: " + _.escape(whois_data.server) + "<br/>";
  return new Handlebars.SafeString(tooltip);
});

Handlebars.registerHelper('getCurrentPMNickInfo', function () {
  var room_id = Session.get('room_id');
  if (!room_id)
    return;
  var server_id = room_id.split('_')[0];
  var nick = room_id.split('_')[1];
  return _get_nick_whois_data(nick, server_id);
})

Handlebars.registerHelper('is_user_away', function (nick, server_name) {
  var server_id = (UserServers.findOne({name: server_name}, {_id: 1}) || {})._id || "";
  var whois_data = _get_nick_whois_data(nick, server_id);
  if (whois_data && whois_data.away)
    return true;
  return false;
});

Handlebars.registerHelper('current_server_id', function () {
  return Session.get('server_id');
});


Handlebars.registerHelper('current_server_away_msg', function () {
  var user_server =  UserServers.findOne({_id: Session.get('server_id')});
  if (user_server)
    return user_server.away_msg || "I'm not around.";
  return '';
});

function _submit_nick_away_data ($form) {
  var away_message = $form.find(
    '#nickAwayMessageInput').val() || "I'm not around.";
  var user_server = UserServers.findOne({_id: Session.get('server_id')});
  if (user_server)
    Meteor.call('mark_away', user_server.name, away_message, function (err) {
      console.log(err);
    });
}

Template.user_nick_options_menu.events = {
  'click .userNickOptions': function (e) {
    e.stopPropagation();
  },
  'submit .updateNickForm': function (e) {
    e.preventDefault();
    e.stopPropagation();
    $form = $(e.target);
    var nick = $form.find('#updateNickInput').val();
    var server_id = $form.data('server-id');
    var server = UserServers.findOne({_id: server_id});
    if (server) {
      Meteor.call('change_nick', server.name, nick, function (err) {
        console.log(err);
        if (!err)
          $('.userNickOptions').parents('.dropup').removeClass('open');
      });
    }
  },
  'submit .nickAwayForm': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $form = $(e.target);
    _submit_nick_away_data($form);
  },
  'click #updateNickAwayCheckbox': function (e) {
    var $this = $(e.target);
    var $form = $this.parents('form.nickAwayForm');
    if ($this.attr('checked')) {
      _submit_nick_away_data($form);
    }
    else {
      var user_server = UserServers.findOne({_id: $form.data('server-id')});
      if (user_server) {
        Meteor.call('mark_active', user_server.name, function (err) {
          console.log(err);
        });
      }
    }
  }
};

Handlebars.registerHelper('isCurrentRoomtype', function (roomtype) {
  if (Session.get('roomtype') == roomtype)
    return true;
  return false;
})

Handlebars.registerHelper('showStatusIcon', function (status) {
  var iconClass = "";
  var statusIconHtml = '';
  if (status == 'connected')
    iconClass = 'glyphicon-ok-circle';
  else if (status == 'disconnected')
    iconClass = 'glyphicon-ban-circle';
  else if (status == 'connecting' || status == 'disconnecting')
    iconClass = 'spin glyphicon-refresh';
  if (iconClass) {
    statusIconHtml = '<icon class="tipsy-enable glyphicon ' + iconClass + '" tooltip="'
      + status + '"></icon>';
  }
  return new Handlebars.SafeString(statusIconHtml);
});

Handlebars.registerHelper('isConnected', function (status) {
  if (status == 'connected')
    return true;
  else
    return false;
});

Handlebars.registerHelper('showDatetime', function (datetime_obj) {
  var today_str = moment(new Date()).format('MM/DD/YYYY');
  if (today_str == moment(datetime_obj).format('MM/DD/YYYY'))
    return moment(datetime_obj).format('hh:mm A');
  else
    return moment(datetime_obj).format('hh:mm A, DD MMM\'YY');
});

Handlebars.registerHelper('isToday', function (date_obj) {
  if (moment(new Date()).format('MM/DD/YYYY') == moment(date_obj).format('MM/DD/YYYY'))
    return true;
  return false;
});

function infoPanelScrollendHandler (e) {
  $(document).off('scrollend.info_panel');
  var $target = $(e.target);
  if (Session.get('roomtype') == 'channel') {
    var channel = UserChannels.findOne({_id: Session.get('room_id')});
    if (!channel)
      return;
    var current_last_nick = Session.get(
      'currentLastNick-' + channel.user_server_name + '_' + channel.name);
    Session.set(
      'lastNick-' + channel.user_server_name + '_' + channel.name,
      current_last_nick);
    Session.set(
      'startNick-' + channel.user_server_name + '_' + channel.name,
      null);
  }
  Meteor.setTimeout(function () {
    $(document).on('scrollend.info_panel', '#info-panel .nano',
      infoPanelScrollendHandler);
  }, 500);
}

$(document).on('scrollend.info_panel', '#info-panel .nano',
  infoPanelScrollendHandler);

function infoPanelScrolltopHandler (e) {
  $(document).off('scrolltop.info_panel');
  var $target = $(e.target);
  if (Session.get('roomtype') == 'channel') {
    var channel = UserChannels.findOne({_id: Session.get('room_id')});
    if (!channel)
      return;
    var current_last_nick = Session.get(
      'currentLastNick-' + channel.user_server_name + '_' + channel.name);
    var current_start_nick = Session.get(
      'currentStartNick-' + channel.user_server_name + '_' + channel.name);
    Session.set(
      'startNick-' + channel.user_server_name + '_' + channel.name,
      current_start_nick);
    Session.set(
      'lastNick-' + channel.user_server_name + '_' + channel.name,
      null);
  }
  Meteor.setTimeout(function () {
    $(document).on('scrolltop.info_panel', '#info-panel .nano',
      infoPanelScrolltopHandler);
  }, 500);
}

$(document).on('scrolltop.info_panel', '#info-panel .nano',
  infoPanelScrolltopHandler);
