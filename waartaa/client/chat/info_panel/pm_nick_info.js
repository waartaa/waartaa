Handlebars.registerHelper('getCurrentPMNickInfo', function () {
  var room_id = Session.get('room_id');
  if (!room_id)
    return;
  var server_id = room_id.split('_')[0];
  var nick = room_id.split('_')[1];
  return _get_nick_whois_data(nick, server_id);
});
