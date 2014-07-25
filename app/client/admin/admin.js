Template.admin.created = function () {
  waartaa.admin.helpers.searchUserServers();
}

var _callbackSearch = function () {
  var search = $('#search-message').val();
  Session.set('user_servers_search_message', search);
  waartaa.admin.helpers.searchUserServers(search);
};

var _callbackNextPrev = function (page) {
  var search = Session.get('user_servers_search_message');
  var sort = Session.get('user_servers_search_sort');
  console.log(sort);
  waartaa.admin.helpers.searchUserServers(search, page, sort);
};

Template.admin.events = {
  'click #search-button': function () {
    _callbackSearch();
  },

  'keyup #search-message': function (e) {
    if (e.keyCode == 13) {
      _callbackSearch();
    }
  },

  'click #previous-icon': function () {
    var currentPage = parseInt($('#page-no').attr('data-current-page'));
    var totalPages = parseInt($('#page-no').attr('data-total-pages'));
    if (currentPage > 1) {
      var page = currentPage - 1;
      _callbackNextPrev(page);
    }
  },

  'click #next-icon': function () {
    var currentPage = parseInt($('#page-no').attr('data-current-page'));
    var totalPages = parseInt($('#page-no').attr('data-total-pages'));
    if (currentPage < totalPages) {
      var page = currentPage + 1;
      _callbackNextPrev(page);
    }
  },

  'keyup #page-no': function (e) {
    if (e.keyCode == 13) {
      var page = parseInt($('#page-no').val());
      var currentPage = parseInt($('#page-no').attr('data-current-page'));
      var totalPages = parseInt($('#page-no').attr('data-total-pages'));
      if (page >= 1 && page <= totalPages && page!=currentPage) {
        _callbackNextPrev(page);
      }
    }
  },

  'click .sortable': function (e) {
    var sort = {};
    var target = $(e.currentTarget);
    var field = target.data('field') || 'nick';
    var child = target.children();
    if (child.hasClass('fa-desc')) {
      var sortOrder = -1;
    } else {
      var sortOrder = 1;
    }
    sort[field] = sortOrder;
    Session.set('user_servers_search_sort', sort);
    var search = Session.get('user_servers_search_message');
    waartaa.admin.helpers.searchUserServers(search, null, sort);
  },

  'click .toggle-join-server': function (e) {
    var target = $(e.currentTarget);
    var serverName = target.attr('data-server-name');
    var userId = target.attr('data-user-id');
    var status = target.attr('data-status');
    if (status == 'connected') {
      Meteor.call('quit_user_server', serverName, false, userId, function (err, result) {
      });
    } else if (status == 'user_disconnected'){
      Meteor.call('join_user_server', serverName, userId, function (err, result) {
      });
    }
  },

  'click .delete-user-server': function (e) {
    if (confirm("Are you sure?")) {
      var target = $(e.currentTarget);
      var id = target.attr('data-id');
      Meteor.call('deleteUserServer', id, function (err, result) {
          if (err || !result) {
            $('#nick-status-error').text(
              'Either you are not authorized or some other error occured.')
              .show().delay(5000).fadeOut();
          }
      });
    }
  }
};
