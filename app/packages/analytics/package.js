Package.describe({
  summary: "Chat log analytics for Waartaa",
  version: "1.0.0",
  git: " \* Fill me in! *\ "
});

Npm.depends({
  locks: "0.1.0"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.3.1');
  api.use(
    ['cfs:micro-queue', 'cfs:reactive-list', 'cfs:power-queue@0.0.1'],
    'server');
  api.use('aldeed:scheduled-tasks@0.1.1', 'server');
  api.addFiles('lib/collections.js', ['server', 'client']);
  api.addFiles('client/collections.js', 'client');
  api.addFiles('server/collections.js', 'server');
  api.addFiles('server/stats.js', 'server');
  api.addFiles('server/publish.js', 'server');
  api.addFiles('client/subscribe.js', 'client');
  api.addFiles('client/stats.js', 'client');
  api.export('ChatRoomLogCountManager', 'server');
  api.export('ChatLogStats', 'server');
  api.export('UnreadLogsCount', ['server', 'client']);
  api.export('UnreadLogsDelta', 'client');
  api.export('chatRoomLogCount', 'server');
  api.export('localChatRoomLogCount', 'client');
});

Package.onTest(function(api) {
  api.use('analytics');
  api.use('tinytest');
  api.addFiles('tests/test_server/test_stats.js', 'server');
});

