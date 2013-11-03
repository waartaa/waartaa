Template.servers_list_for_user.serversForUser = function () {
  var user_servers = UserServers.find();
  var server_names = [];
  user_servers.forEach(function(user_server) {
    server_names.push(user_server.name);
  });

  return Servers.find({'name':{ $nin: server_names}});
};

Template.accordion_user_servers.events({
  'click .icon-trash': function(e) {
      e.preventDefault();
      e.stopPropagation();

      var userservers = UserServers.find();
      userservers.forEach(function(us) {
          $this = $(e.currentTarget);
          var server_id = $this.parents('a.accordion-toggle').data('user-server-id');
          UserServers.remove(server_id);
      });
  }
});

Template.accordion_join_server.events({
  'submit form': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var data = {
      server_id: $('#server-join-server-list').val(),
      nick: $('#server-join-nick').val(),
      password: $('#server-join-password').val(),
      channels: $('#server-join-channels').val()
    };
    console.log(data);
    Meteor.call('user_server_create', data, function (err) {
      console.log(err);
    });
  },
});

Template.accordion_user_servers.userServers = function () {
  return UserServers.find();
};

Template.accordion_user_servers.events({
  'submit form.update-user-server-form': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $form = $(e.target);
    var data = {};
    $.each($form.serializeArray(), function (index, value) {
      data[value.name] = value.value;
    })
    console.log(data);
    Meteor.call('user_server_create', data, function (err) {
      console.log(err);
    })
  }
});

Handlebars.registerHelper('listToCsv', function (items) {
  return items.join(', ');
});
