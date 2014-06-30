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
    var room = Session.get('room');
    if (!room)
      return;
    try {
      var user_server = UserServers.findOne(
        {_id: room.server_id}, {});
      var myNick = user_server.current_nick;
    } catch (err) {
      var myNick = Meteor.user().username;
    }
    if (!message)
      return;
    $chat_input.val('');
    var log_options = {
      room_id: room.room_id,
      roomtype: room.roomtype,
      logInput: true
    };
    var user = Meteor.user();
    if (room.roomtype == 'channel') {
      var user_server = UserServers.findOne({_id: room.server_id}) || {};
      var channel = UserChannels.findOne({
        user_server_id: user_server._id, _id: room.room_id});
      if (channel)
        ChannelLogs.insert({
            message: message,
            raw_message: '',
            from: user_server.current_nick,
            from_user: user.username,
            from_user_id: Meteor.userId(),
            channel_name: channel.name,
            channel_id: channel._id,
            server_name: user_server.name,
            server_id: user_server._id,
            user: user.username,
            user_id: user._id,
            created: new Date(Meteor.getServerMS()),
            last_updated: new Date(Meteor.getServerMS()),
            status: "new"
        });
    } else if (room.roomtype == 'pm') {
      Meteor.call('send_pm', message, room.room_id, log_options)
    } else if (room.roomtype == 'server') {
      Meteor.call(
        'send_server_message', room.room_id, message, log_options);
    }
    var selfMsgKey = 'selfMsg-' + room.roomtype + '-' + 'chat-logs-' + room.room_id;
    Session.set(selfMsgKey, true);
    $('.chat-logs-container').scrollTop($('.chatlogs-table').height());
  }
});

function _submit_nick_away_data ($form) {
  var away_message = $form.find(
    '#nickAwayMessageInput').val() || "I'm not around.";
  var room = Session.get('room') || {};
  var user_server = UserServers.findOne({_id: room.server_id});
  if (user_server)
    Meteor.call('mark_away', user_server.name, away_message, function (err) {
      if (!err)
        $('.userNickOptions').parents('.dropup').removeClass('open');
    });
  else
    $('.userNickOptions').parents('.dropup').removeClass('open');
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
          $('.userNickOptions').parents('.dropup').removeClass('open');
        });
      }
    }
  }
};

UI.registerHelper("server_current_nick", function () {
  var room = Session.get('room');
  if (!room)
    return;
  var user_server = UserServers.findOne({_id: room.server_id});
  if (user_server) {
    return user_server.current_nick;
  }
});

function _getMatchingNicks (term) {
  var nicks = [];
  var channel = null;
  var room = Session.get('room');
  if (room.roomtype == 'channel') {
    channel = UserChannels.findOne({_id: room.room_id});
  }
  if (!channel)
    return;
  ChannelNickSugesstions.find(
    {
      nick: {$regex: '^' + term + '.+'},
      channel_name: channel.name,
      server_name: channel.user_server_name
    },
    {nick: 1}
  ).forEach(function (nick) {
    nicks.push(nick.nick);
  });
  return nicks;
}

ChannelNickSugesstions = new Meteor.Collection("channel_nick_suggestions");

function autocompleteNicksInitiate () {
  function split (val) {
    return val.split(/(^|[\ ]+)/ );
  }

  function extractLast ( term ) {
    return split(term).pop();
  }

  var auto_suggest = false;
  var room = Session.get('room') || {};

  $('#chat-input')
    .bind('keydown', function (event) {
      if (room.roomtype != 'channel')
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
        var room = Session.get('room');
        if (!room)
          return;
        var channel = UserChannels.findOne({_id: room.room_id});
        if (!channel)
          return;
        // try to autocomplete nick from existing ChannelNickSuggestions
        // immediately
        response( $.ui.autocomplete.filter(
          _getMatchingNicks(request.term), extractLast( request.term ) ) );
        Meteor.subscribe(
          'channel_nick_suggestions', channel.user_server_name, channel.name,
          request.term, 10, function () {
            response( $.ui.autocomplete.filter(
              _getMatchingNicks(request.term), extractLast( request.term ) ) );
          }
        );
      },
      search: function (event, ui) {
        var $input = $('#chat-input');
        var val = $input.val() || "";
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

Template.chat_input.created = function () {
  Meteor.setTimeout(Deps.autorun(autocompleteNicksInitiate), 0);
};

Template.chat_input.renderNickOptions = function () {
  if (Session.get('room')) {
    return true;
  }
  return false;
};

