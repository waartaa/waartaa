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
