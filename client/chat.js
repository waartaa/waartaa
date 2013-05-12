updateHeight = function () {
  highlightChannel();
  var body_height = $('body').height();
  var final_height = body_height - 90;
  $('#chat, #chat-channel-users, #chat-main, #chat-servers').height(final_height);
  $('#chat-logs-container').height(final_height - $('#chat-main .topic').height() - 15);
}

Template.chat_connections.servers = function () {
  return Servers.find();
}

Template.server_channels.channels = function (server_id) {
  return Channels.find({server_id: server_id});
}

Template.chat.rendered = function () {
  $('.content-main').addClass('no-padding');
}

function  highlightChannel () {
  var room_id = Session.get('room_id');
  var server_id = Session.get('server_id');
  $('#server-' + server_id).find('.dropdown.active').removeClass('active');
  $('.server-room').parent().removeClass('active');
  if (room_id) {
    if (Session.get('roomtype') == 'channel')
      $('.server-room#channel-id-' + room_id).parent().addClass('active');
    else if (Session.get('roomtype') == 'pm')
      $('.server-room#' + room_id).parent().addClass('active');
    refreshAutocompleteNicksSource();
    $('#chat-input').focus();
  } else {
    $('#server-' + server_id + ' ul.server-link-ul li:first').addClass('active');
  }
}

Template.chat_main.chat_logs = function () {
  var room_id = Session.get('room_id');
  if (Session.get('roomtype') == 'channel') {
    return ChannelLogs.find({channel_id: room_id});
  } else if (Session.get('roomtype') == 'pm') {
    var nick = room_id.substr(room_id.indexOf('-') + 1);
    return PMLogs.find({
      $or: [
        {from: nick, to_user_id: Meteor.user()._id},
        {from_user_id: Meteor.user()._id, to: nick}
      ]
    });
  }
}

Template.chat_main.topic = function () {
  try {
    var channel = Channels.findOne({_id: Session.get('room_id')});
    if (channel) {
      return channel.topic || "";
    }
  } catch (err) {
    return "";
  }
};

Template.chat_main.server_logs = function () {
  var server_id = Session.get('server_id');
  return ServerLogs.find({server_id: server_id});
};

Template.chat_main.no_room = function () {
  if (Session.get('room_id'))
    return false;
  return true;
};

Template.chat_main.rendered = updateHeight;

Template.chat_main.events = {
  'scroll #chat-logs-container': function (event) {
    var scroll_top = $(event.target).scrollTop();
    if ((event.target.scrollHeight - scroll_top) <= $(this).outerHeight())
      scroll_top = null;
    if (Session.get('roomtype') == 'channel')
      Session.set('scroll_height_' + Session.get('channel_id'),
        scroll_top);
    else if (Session.get('roomtype') == 'pm')
      Session.set('scroll_height_' + Session.get('pm_id'),
        scroll_top);
  }
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
  var channel = Channels.findOne({_id: Session.get('room_id')}) || {};
  for (var nick in channel.nicks || {})
    channel_nicks.push(nick);
  return channel_nicks;
}

function serverRoomSelectHandler (event) {
    var $target = $(event.target);
    if ($target.hasClass('caret') || $target.hasClass('dropdown-caret'))
      return;
    event.stopPropagation();
    $('.dropdown.open').removeClass('open');
    var prev_room_id = Session.get('room_id');
    Session.set('scroll_height_' + prev_room_id, $('#chat-logs-container').scrollTop() || null);
    if ($target.data('roomtype') == 'channel') {
      var server_id = $target.parents('.server').data('server-id');
      Session.set('server_id', server_id);
      Session.set('roomtype', 'channel');
      Session.set('room_id', $(event.target).data('id'));
      channel_nicks = getChannelNicks();
    } else if ($target.data('roomtype') == 'pm') {
      var server_id = $target.parents('.server').data('server-id');
      Session.set('server_id', server_id);
      Session.set('roomtype', 'pm');
      Session.set('room_id', $target.attr('id'));
    } else {
      Session.set('server_id', $target.parent().data('server-id'));
    }
    highlightChannel();
} 

Template.chat_connections.events({
  'click .server-room': serverRoomSelectHandler,
  'click .server-link': function (e) {
    if (!$(e.target).hasClass('dropdown-caret')) {
      Session.set('room_id');
      Session.set('roomtype');
    }
    serverRoomSelectHandler(e);
  }
});

Template.server_pms.pms = function (id) {
  var server = Servers.findOne({_id: id});
  var user = Meteor.user();
  var pms = user.profile.connections[id].pms;
  var return_pms = [];
  for (nick in pms)
    return_pms.push({name: nick, server_id: server._id});
  return return_pms;
}

function chatUserClickHandler (event) {
    if ($(event.target).hasClass('caret'))
      return;
    event.stopPropagation();
    $('.channel-user').parent().removeClass('active');
    $('.dropdown.open').removeClass('open');
    $(event.target).parent().addClass('active');
}

Template.server_channels.rendered = updateHeight;

Template.chat_users.channel_users = function () {
  if (Session.get('roomtype') == 'channel') {
    var channel_id = Session.get('room_id');
    var channel = Channels.findOne({_id: channel_id});
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

Template.chat_main.rendered = function () {
  setTimeout(function () {
    updateHeight();
    var channel_height = Session.get(
      'scroll_height_' + Session.get('channel_id'));
    $('#chat-logs-container').scrollTop(channel_height || $('#chat-logs').height());
  }, 0);
};

Template.chat_main.destroyed = function () {
  Session.set('scroll_height_' + Session.get('channel_id'), $('#chat-logs-container').scrollTop());
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
      var myNick = Meteor.user().profile.connections[Session.get(
        'server_id')].client_data.nick;
    } catch (err) {
      console.log(err);
      var myNick = null;
    }
    if (!message)
      return;
    $chat_input.val('');
    if (Session.get('roomtype') == 'channel') {
      var room_id = Session.get('room_id');
      var channel = Channels.findOne({_id: room_id});
      ChannelLogs.insert({
        from: myNick || Meteor.user().username,
        user_id: Meteor.user()._id,
        channel: channel.name,
        channel_id: room_id,
        message: message,
        time: new Date(),
      });
      Meteor.call('say', message, room_id, roomtype="channel");
    } else if (Session.get('roomtype') == 'pm') {
      var room_id = Session.get('room_id');
      var nick = room_id.substr(room_id.indexOf('-') + 1);
      PMLogs.insert({
        from: myNick || Meteor.user().username,
        from_user_id: Meteor.user()._id,
        to: nick,
        message: message,
        time: new Date(),
      });
      Meteor.call('say', message, room_id, roomtype='pm');
    }
    Session.set('scroll_height_' + room_id, null);
  }
});

Template.chat_users.events = {
  'click .pm-user': function (event) {
    var $target = $(event.target);
    var nick = $target.data('user-nick');
    var user = Meteor.user();
    var profile = user.profile;
    var server_id = Session.get('server_id');
    if (!profile.connections[server_id].pms)
      profile.connections[server_id].pms = {};
    profile.connections[server_id].pms[nick] = '';
    Meteor.users.update({_id: user._id}, {$set: {profile: profile}});
    Session.set('roomtype', 'pm');
    Session.set('room_id', Session.get('server_id') + '-' + nick);
  },
  'click .channel-user': chatUserClickHandler,
};

Template.chat_input.rendered = function () {
  autocompleteNicksInitiate();
}
