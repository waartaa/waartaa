if (Meteor.isServer) {
  irc = Meteor.npmRequire('irc');
  fs = Meteor.npmRequire('fs');
  Fiber = Meteor.npmRequire('fibers');
  CappedArray = Meteor.npmRequire('capped-array');
  locks = Meteor.npmRequire('locks');
  crypto = Meteor.npmRequire('crypto');
  Map = Npm.require('collections/map');
  /*try {
    elasticsearch = Meteor.npmRequire('elasticsearch');
  } catch (err) {
    elasticsearch = require('elasticsearch');
  }*/
}

