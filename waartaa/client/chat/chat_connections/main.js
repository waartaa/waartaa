Template.chat_connections.servers = function () {
  return UserServers.find();
};

Template.chat_connections.created = function () {
    Meteor.setTimeout(function () {
        if (UserServers.find().count() == 0)
            $('#server-add-btn').click();
    }, 4000);
};
