Template.chat_connections.servers = function () {
  return UserServers.find();
};

Template.chat_connections_sentinel_content.rendered = function () {
    waartaa.chat.helpers.highlightServerRoom();
};
