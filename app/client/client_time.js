/**
 * When the client initializes this JS
 *
 * it gets the server time and sets a Session variable `serverTimeOffset`
 * so the client always knows how far it's off from server time
 * (and can be in sync)
 *
 */
// getServerMS() and calculate offset/diff, set into session var
Meteor.setServerTime = function() {
  //get server time (it's in milliseconds)
  Meteor.call("getServerMS", function (error, serverMS) {
    //get client time in milliseconds
    localMS = new Date().getTime();
    //difference between server and client
    var serverOffset = serverMS - localMS;
    //store difference in the session
    Session.set('serverTimeOffset', serverOffset);
  });
};

/**
 * get server time but return in Seconds instead of MS
 * @param number epoch (seconds) - or empty = now
 * @return number epoch (seconds) adjusted for server
 */
// Method to "calculate" server time, based on the offset
// which is gathered in the statup, and refreshed in the interval
Meteor.getServerMS = function(epochMS) {
  if (!_.isNumber(epochMS)) {
    epochMS = new Date().getTime();
  }
  return epochMS + Session.get('serverTimeOffset');
};
/**
 * get server time but return in Seconds instead of MS
 * @param number epoch (seconds) - or empty = now
 * @return number epoch (seconds) adjusted for server
 */
Meteor.getServerSec = function(epoch) {
  if (_.isNumber(epoch)) {
    return Math.round(Meteor.getServerMS(epoch * 1000) / 1000);
  }
  return Math.round(Meteor.getServerMS() / 1000);
};

// Automate setup on client statup
Meteor.startup(function () {
  // get serverOffset on startup
  Meteor.setServerTime();
  // update serverOffset every 15min
  Meteor.clearInterval(Meteor.intervalUpdateServerTime);
  Meteor.intervalUpdateServerTime = Meteor.setInterval(function() { Meteor.setServerTime(); }, 900000);
});


// pass the clock to the HTML template
UI.registerHelper('time', function () {
  return new Date(Meteor.getServerMS());
});
