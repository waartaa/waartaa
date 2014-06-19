Template.video_chat_users.rendered = function () {
  updateHeight();
};

Template.video_chat_users.list = function () {
  if (Session.get('selfEasyrtcId'))
    return Session.get('videoUsersList') || [];
  else
    return [];
}

Template.video_chat_users.events({
  'click .call-btn': function (e) {
    var easyrtcId = $(e.target).data('easyrtcid');
    VideoChat.performCall(easyrtcId);
  }
});

Template.video_chat_users.helpers({
  showCallButton: function (easyrtcId) {
    if(Session.get('otherEasyrtcId') != easyrtcId) {
      if (Session.get('videoCallingId') == easyrtcId) {
        var callText = 'Calling...';
        var callClass = 'btn call-btn green-btn';
      } else {
        var callText = 'Call';
        var callClass = 'btn call-btn';
      }
      var buttonHTML = '<button type="button" class="'+callClass+'"';
         buttonHTML += 'data-easyrtcid="'+easyrtcId+'">'+callText+'</button>';
      return Spacebars.SafeString(buttonHTML);
    }
  }
});
