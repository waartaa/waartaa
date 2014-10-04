Meteor.startup(function () {
  
  Meteor.subscribe('unread_logs_count', function (err) {
    if (err)
      return;
  });
});
