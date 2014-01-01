Template.server_pm_item.rendered = function () {
  Session.set("lastAccessedPm-" + this.data.server_id + '_' + this.data.from);
};

Template.server_pm_menu.events = {
  'click .pm-remove': function (e) {
    var user = Meteor.user();
    var $target = $(e.target);
    var pm_id = $(e.target).parents('li').find(
      '.pm.server-room').attr('id');
    var user_server_id = $target.data('server-id');
    var nick = $target.data('user-nick');
    var profile = user.profile;
    var userpms=UserPms.findOne({user_id: user._id});
    var pms = userpms.pms;
     var server = UserServers.findOne({_id: user_server_id});
    var server_name = server.name;
    delete pms[nick];
    UserPms.upsert(
      {user_id: user._id,
       user_server_id: user_server_id,
       user_server_name: server_name,
       user: user.username},
       {$set: {pms: pms}});

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
