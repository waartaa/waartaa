Template.chat.created = function () {
  Meteor.setTimeout(function () {
    $('.content-main').addClass('no-padding');
    updateHeight();
  }, 0);
}

Template.chat.helpers({
  'isChatRoomSelected': function () {
    var room = Session.get('room');
    if (room)
      return true;
    return false;
  }
});

Deps.autorun(waartaa.chat.helpers.highlightServerRoom);

