Package.describe({
  summary: "Chat log analytics for Waartaa",
  version: "1.0.0",
  git: " \* Fill me in! *\ "
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.2.2');
  api.addFiles('lib/collections.js', 'server');
  api.addFiles('server/stats.js', 'server');
  api.export('ChatRoomLogCountManager', 'server');
  api.export('ChatLogStats', 'server');
});

Package.onTest(function(api) {
  //api.use('tinytest');
  //api.use('analytics');
  //api.addFiles('analytics-tests.js');
});
