Template.server_pm_item.created = function () {
  Session.set("lastAccessedPm-" + this.data.server_id + '_' + this.data.from);
};

Template.server_pm_item.events = {
  'click .pm-remove': function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $target = $(e.target).parent('a');
    var roomId = $(e.target).parents('li').first().find(
      '.pm.server-room').attr('data-roomid');
    var userPm = UserPms.findOne({_id: roomId});
    var path = '/chat/server/' + userPm.user_server_name;
    Router.go(path, {replaceState: true});
    UserPms.remove({_id: roomId});
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
  UserPms.find({
    user_server_name: server.name, user: user.username
  }).forEach(function (pm) {
    pms.push({
      name: pm.name, server_id: server._id,
      room_id: pm._id,
      server_name: server.name,
    });
  });
  return pms;
});

UI.registerHelper('currentPM', function () {
  var room = Session.get('room') || {};
  if (room.roomtype === 'pm') {
    return {name: room.nick, server_id: room.server_id, room_id: room.room_id};
  }
});
