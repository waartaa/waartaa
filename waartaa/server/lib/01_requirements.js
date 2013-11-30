if (Meteor.isServer) {
	irc = Npm.require('irc');
	Fiber = Npm.require('fibers');
	crypto = Npm.require('crypto');
    try {
        var privateKey = Assets.getText('certs/privatekey.pem');
        var certificate = Assets.getText('certs/certificate.pem');
        ssl_credentials = crypto.createCredentials({
            key: privateKey, cert: certificate});
        delete privatekey;
        delete certificate;
    catch (err) {
        ssl_credentials = false;
    }
}
