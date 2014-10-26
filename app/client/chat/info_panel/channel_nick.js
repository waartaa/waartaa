Template.user_menu.events = {
  'click .whois-user': function (event) {
    var $target = $(event.target);
    var nick = $target.data('user-nick');
    var user = Meteor.user();
    var server_id = $target.parents('.info-panel-item').data('server-id');
    var server = UserServers.findOne({_id: server_id});
    var room = Session.get('room');
    if (!room)
      return;
    Meteor.call(
      'send_command', server.name, '/WHOIS ' + nick, {
        room_id: room.room_id,
        roomtype: room.roomtype
    });
  }
};

Template.chat_user.events = {
  'click .user-nicks': function(event){
    var nick = $(event.target).attr("title");
    if( !$('#chat-input').val() ){
      $('#chat-input').val(nick + ', ');
    }
    else{
      $('#chat-input').val($('#chat-input').val() + ' ' + nick + ', ');
    }
  }
};

UI.registerHelper('is_user_away', function (nick, server_name) {
  var server_id = (UserServers.findOne({name: server_name}, {_id: 1}) || {})._id || "";
  var whois_data = _get_nick_whois_data(nick, server_id);
  if (whois_data && whois_data.away)
    return true;
  return false;
});

_get_nick_whois_data = function (nick, user_server_id) {
  var user_server = UserServers.findOne({_id: user_server_id});
  if (!user_server)
    return;
  return ServerNicks.findOne({
    nick: nick, server_id: user_server.server_id});
};

UI.registerHelper('whois_tooltip', function (nick, server_name) {
  var tooltip = "";
  var server_id = (UserServers.findOne({name: server_name}, {_id: 1}) || {})._id;
  var whois_data = _get_nick_whois_data(nick, server_id);
  if (whois_data)
    tooltip = "Username: " + _.escape(whois_data.user) + "<br/>" +
      "Real name: " + _.escape(whois_data.realname) + "<br/>" +
      "Server: " + _.escape(whois_data.server) + "<br/>";
  return new Spacebars.SafeString(tooltip);
});
