Template.user_loggedin_content.chatPage = function(){
  return Session.get("userLoggedInChatPage");
}

Template.user_loggedin_content.accountSettingsPage = function () {
  return Session.get("userLoggedInAccountSettingsPage");
}
