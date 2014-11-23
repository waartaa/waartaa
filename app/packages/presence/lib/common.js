Presences = new Meteor.Collection('presences');
// For backwards compatibilty
Meteor.presences = Presences;

Meteor.methods({
  updatePresence: function(state) {
    check(state, Match.Any);

    var connectionId = this.isSimulation
      ? Meteor.connection._lastSessionId
      : this.connection.id;

    // Should never happen
    if (! connectionId)
      return;

    var update = {};
    update.state = state;
    if (typeof Meteor.userId !== 'undefined' && Meteor.userId())
      update.userId = Meteor.userId();

    Presences.update(connectionId, update);
  }
});
