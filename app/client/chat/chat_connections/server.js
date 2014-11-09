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
