if (Meteor.isServer) {
	irc = Npm.require('irc');
	Fiber = Npm.require('fibers');
	crypto = Npm.require('crypto');
}
