function serverRoomSelectHandler (event) {
    var $target = $(event.target);
    // Return if clicked on a server menu item
    if ($target.parents('.btn-group').length > 0)
      return;
    var prev_room = Session.get('room') || {};
    var roomtypes = {
      'channel': true,
      'server': true,
      'pm': true
    };
    // Show loader if selected room is not yet active
    if (!$target.parent().hasClass('active')) {
      if (
          (
            roomtypes[$target.data('roomtype')] &&
            $target.data('id') == prev_room.room_id
          ) ||
          (
            roomtypes[$target.data('roomtype')] &&
            $target.data('roomid') == prev_room.room_id
          )
      )
        $target.parent().addClass('active');
      else
        $('#chatlogs-loader').show();
    }
    event.stopPropagation();
    // Close any open menu
    $('.dropdown.open, .btn-group.open').removeClass('open');
    if (prev_room.roomtype == 'server')
      Session.set(
        'user_server_log_count_' + prev_room.server_id, DEFAULT_LOGS_COUNT);
    else if (prev_room.roomtype == 'channel')
      Session.set(
        'user_channel_log_count_' + prev_room.channel_id, DEFAULT_LOGS_COUNT);
    else if (prev_room.roomtype == 'pm')
      Session.set(
        'pmLogCount-' + prev_room.room_id, DEFAULT_LOGS_COUNT);
    Meteor.setTimeout(function () {
      if ($target.data('roomtype') == 'channel') {
        var server_id = $target.parents('.server').data('server-id');
        var channel_id = $(event.target).data('id');
        var channel = UserChannels.findOne({_id: channel_id}) || {};
        waartaa.chat.helpers.setCurrentRoom({
          roomtype: 'channel', server_id: server_id, channel_id: channel_id,
          channel_name: channel.name, server_name: channel.user_server_name
        });
      } else if ($target.data('roomtype') == 'pm') {
        var server_id = $target.parents('.server').data('server-id');
        var nick = $target.data('nick');
        var server = UserServers.findOne({_id: server_id});
        waartaa.chat.helpers.setCurrentRoom({
          roomtype: 'pm', server_id: server_id, room_id: $target.data('roomid'),
          server_name: server.name, nick: nick
        });
      } else if (
          $target.data('roomtype') == 'server' ||
          $target.parent().data('roomtype') == 'server') {
        var server_id = $target.parent().data('server-id') ||
          $target.data('server-id');
        var server = UserServers.findOne({_id: server_id});
        waartaa.chat.helpers.setCurrentRoom({
          roomtype: 'server', server_id: server_id, server_name: server.name
        });
      }
    }, 200);
}

Template.chat_connection_server.events({
  'click .server-room': serverRoomSelectHandler,
  'click .server-link': serverRoomSelectHandler
});

Template.chat_connection_server.created = function () {
  Session.set("lastAccessedServer-" + this.data._id, new Date());
};

Template.chat_connection_server.helpers({
  isServerActive: function () {
    if ((Session.get('room') || {}).server_id === this._id)
      return true;
  }
});

Template.server_menu.events({
  'click .serverEditLink': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $this = $(e.target);
    var server_id = $this.data('server-id');
    var $modal_content = $('#editServerModal-' + server_id);
    $this.parents('.open').removeClass('open');
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
    $this.parents('.open').removeClass('open');
    $modal_content.modal().on('shown.bs.modal', function (e) {
      $modal_content.find('input[name="names"]').focus();
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
    var $this = $(e.currentTarget);
    var server_id = $this.data('server-id');
    var server = UserServers.findOne({_id: server_id});
    if (!server)
      return;
    var status = $this.attr('data-status');
    if (status == 'connected')
      Meteor.call(
        "quit_user_server", server.name, false);
    else
      Meteor.call('join_user_server', server.name);
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
    Meteor.call('join_user_channel', server.name, data.names);
    var $modal_content = $('#addServerChannel-' + server_id);
    $modal_content.modal('hide');
  }
});

updateUnreadLogsCount = function (unread_logs_count_key, 
                                  last_accessed_key, last_updated, update_session) {
  var last_accessed = Session.get(last_accessed_key);
  var count = 0;
  if (last_updated > last_accessed) {
    var unread_logs_count = Session.get(unread_logs_count_key) || 0;
    unread_logs_count += 1;
    count += 1;
    if (update_session)
      Session.set(unread_logs_count_key, unread_logs_count);
  }
  return count;
};

updateUnreadMentionsCount = function (
    unread_mentions_count_key, last_accessed_key, last_updated,
    update_session) {
  var last_accessed = Session.get(last_accessed_key);
  var count = 0;
  if (last_updated > last_accessed) {
    var unread_mentions_count = Session.get(unread_mentions_count_key) || 0;
    unread_mentions_count += 1;
    count += 1;
    if (update_session)
      Session.set(unread_mentions_count_key, unread_mentions_count);
  }
  return count;

};
