Package.describe({
  name: "jquery-titlealert",
  summary: "Plugin for flashing messages in the browser title bar",
  version: "0.7.0"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.2.2');
  api.addFiles('jquery-titlealert.js', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('jquery-titlealert');
  api.addFiles('jquery-titlealert-tests.js');
});
