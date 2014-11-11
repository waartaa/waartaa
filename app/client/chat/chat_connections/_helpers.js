UI.registerHelper('showStatusIcon', function (status) {
  var iconClass = "";
  var statusIconHtml = '';
  if (status == 'connected')
    iconClass = 'fa-check-circle-o';
  else if (status == 'disconnected' || status == 'user_disconnected')
    iconClass = 'fa-ban';
  else if (status == 'connecting' || status == 'disconnecting')
    iconClass = 'spin fa-refresh';
  if (iconClass) {
    statusIconHtml = '<icon class="tipsy-enable fa ' + iconClass + '" tooltip="'
      + status + '"></icon>';
  }
  return new Spacebars.SafeString(statusIconHtml);
});
