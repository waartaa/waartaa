Package.describe({
  name: "presence-local",
  summary: "A package to help track users' presence",
  version: "1.0.2",
  git: "https://github.com/dburles/meteor-presence.git"
});

Package.onUse(function (api) {
  api.versionsFrom('1.0');
  api.addFiles('lib/common.js', ['client', 'server']);
  api.addFiles('lib/client.js', 'client');
  api.addFiles('lib/server.js', 'server');

  api.export('Presences', ['client', 'server']);
  api.export('Presence', ['client', 'server']);
});
