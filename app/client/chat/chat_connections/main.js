Template.chat_connections.servers = function () {
  return UserServers.find();
};

Template.chat_connections.created = function () {
    Meteor.setTimeout(function () {
      waartaa.chat.helpers.highlightServerRoom();
    }, 1000);
};
