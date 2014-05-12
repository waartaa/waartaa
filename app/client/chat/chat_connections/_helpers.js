UI.registerHelper('showStatusIcon', function (status) {
  var iconClass = "";
  var statusIconHtml = '';
  if (status == 'connected')
    iconClass = 'glyphicon-ok-circle';
  else if (status == 'disconnected' || status == 'user_disconnected')
    iconClass = 'glyphicon-ban-circle';
  else if (status == 'connecting' || status == 'disconnecting')
    iconClass = 'spin glyphicon-refresh';
  if (iconClass) {
    statusIconHtml = '<icon class="tipsy-enable glyphicon ' + iconClass + '" tooltip="'
      + status + '"></icon>';
  }
  return new Spacebars.SafeString(statusIconHtml);
});
