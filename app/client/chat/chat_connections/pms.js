Template.server_pm_item.created = function () {
  Session.set("lastAccessedPm-" + this.data.server_id + '_' + this.data.from);
};

Template.server_pm_item.events = {
  'click .pm-remove': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $target = $(e.target).parent('a');
    var pm_id = $(e.target).parents('li').find(
      '.pm.server-room').attr('id');
    var user_server_id = $target.data('server-id');
    var nick = $target.data('user-nick');
    Meteor.call('toggle_pm', user_server_id, nick, 'delete');
  }
}

Template.server_pm_item.helpers({
  isPmActive: function () {
    var room = Session.get('room') || {};
    if (room.roomtype == 'pm' && room.server_id == this.server_id &&
        room.nick == this.name)
      return true;
  }
});

UI.registerHelper('pms', function (id) {
  var server = UserServers.findOne({_id: id});
  var user = Meteor.user();
  if (!server || !user)
    return [];
  var pms = [];
   var userpms = UserPms.findOne(
    {user_id: user._id, user_server_id: server._id});
  try {
    var pms = userpms.pms;
  } catch (err) {}
  var return_pms = [];
  for (nick in pms)
    return_pms.push({name: nick, server_id: server._id, room_id: server._id + '_' + nick});
  return return_pms;
});

UI.registerHelper('currentPM', function () {
  var room = Session.get('room') || {};
  if (room.roomtype === 'pm') {
    return {name: room.nick, server_id: room.server_id, room_id: room.room_id};
  }
});
