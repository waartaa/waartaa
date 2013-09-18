waartaa
=======

A web IRC client written in Meteor JS. It is aimed towards being an intuitive, collaborative IRC client across
multiple devices of the user along with centralized logging.


Setup
=====
1. Install Meteor: ``$ curl https://install.meteor.com | sh``
1. Clone repo: ``$ git clone https://github.com/rtnpro/waartaa.git``
1. Change dir to waartaa: ``$ cd waartaa``
1. Copy sample settings file: ``$ cp server/settings-local.js-dist server/settings-local.js``
   and customize ``server/settings-local.js`` as needed.
1. Install ``node-irc``: ``mkdir -p .meteor/local/build/server; cd .meteor/local/build/server; npm install irc; cd path/to/waartaa/dir;``
1. Setup basic meteor files: ``$ meteor`` // You may get an error when you first run this.
1. Open .meteor/packages and add ``standard-app-packages`` if it does not exist.
1. Install ``meteorite``: ``$ npm install meteorite``
1. Add meteor-irc: ``$ mrt add irc``
1. Run waartaa development server: ``$ meteor``
