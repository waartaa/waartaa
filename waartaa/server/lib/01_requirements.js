if (Meteor.isServer) {
    try {
	   irc = Npm.require('irc');
    } catch (err) {
        irc = require('irc');
    }
    try {
        fs = Npm.require('fs');
    } catch (err) {
        fs = require('fs');
    }
    try {
	   Fiber = Npm.require('fibers');
    } catch (err) {
        Fiber = require('fibers');
    }
	crypto = Npm.require('crypto');
    try {
        var privateKey = Assets.getText('certs/privatekey.pem');
        var certificate = Assets.getText('certs/certificate.pem');
        ssl_credentials = crypto.createCredentials({
            key: privateKey, cert: certificate});
        delete privatekey;
        delete certificate;
    } catch (err) {
        ssl_credentials = false;
    }
}
