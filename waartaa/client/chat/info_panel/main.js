Template.info_panel_body.rendered = function () {
  $('#info-panel .nano').nanoScroller();
}
Template.info_panel_header.events = {
  'keyup #users-search': function (e) {
    var searchKey = $('#users-search').val();
    Session.set ('searchKey', searchKey);
  }
}
