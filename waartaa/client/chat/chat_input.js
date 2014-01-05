
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
      //console.log(err);
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
    if (room.roomtype == 'channel') {
      Meteor.call('send_channel_message', room.room_id, message, log_options);
    } else if (room.roomtype == 'pm') {
      Meteor.call('send_pm', message, room.room_id, log_options)
    } else if (room.roomtype == 'server') {
      Meteor.call(
        'send_server_message', room.room_id, message, log_options);
    }
    var selfMsgKey = 'selfMsg-' + room.roomtype + '-' + 'chat-logs-' + room.room_id;
    Session.set(selfMsgKey, true);
  }
});

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

Handlebars.registerHelper("server_current_nick", function () {
  var room = Session.get('room');
  if (!room)
    return;
  var user_server = UserServers.findOne({_id: room.server_id});
  if (user_server) {
    return user_server.current_nick;
  }
});
