function serverRoomSelectHandler (event) {
    var $target = $(event.target);
    // Return if clicked on a server menu item
    if ($target.hasClass('server-room-menu-btn') ||
        $target.parent().hasClass('server-room-menu-btn'))
      return;
    event.stopPropagation();
    // Close any open menu
    $('.dropdown.open, .btn-group.open').removeClass('open');
    $('.chatroom').hide();
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
}

Template.chat_connection_server.events({
  'click .server-room': serverRoomSelectHandler,
  'click .server-link': serverRoomSelectHandler
});

Template.chat_connection_server.rendered = function () {
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
