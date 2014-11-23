Presence = {};
Presence.state = function() {
  return 'online';
};

// For backwards compatibilty
Meteor.Presence = Presence;

Meteor.startup(function() {
  Tracker.autorun(function() {
    // This also runs on sign-in/sign-out
    if (Meteor.status().status === 'connected')
      Meteor.call('updatePresence', Presence.state());
  });

  Meteor.setInterval(function() {
    Meteor.call('presenceTick');
  }, 5000);
});
