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
    Meteor.call('user_server_create', data, function (err) {
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
    });
    var user_server = UserServers.findOne(data.user_server_id) || {};
    data.server_id = user_server.server_id;
    Meteor.call('user_server_create', data, function (err) {
      $('#editServerModal-' + server_id).modal('hide');
    })
  }
});

Template.servers_list_for_user.serversForUser = function () {
  var user_servers = UserServers.find();
  var server_names = [];
  user_servers.forEach(function(user_server) {
    server_names.push(user_server.name);
  });

  return Servers.find({'name':{ $nin: server_names}});
};
