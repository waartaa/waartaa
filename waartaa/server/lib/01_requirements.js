if (Meteor.isServer) {
	irc = Npm.require('IRC');
	Fiber = Npm.require('fibers');
}
