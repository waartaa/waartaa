UI.registerHelper('getCurrentPMNickInfo', function () {
  var room = Session.get('room') || {};
  if (room.roomtype != 'pm')
    return;
  return _get_nick_whois_data(room.nick, room.server_id);
});
