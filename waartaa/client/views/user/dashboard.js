Template.servers_list_for_user.serversForUser = function () {
  return Servers.find();
};

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

Handlebars.registerHelper('listToCsv', function (items) {
  return items.join(', ');
});