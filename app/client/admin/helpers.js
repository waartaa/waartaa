waartaa.admin.helpers = {
  'searchUserServers': function (search, pageNo, sort) {
    $('#chatlogs-loader').show();
    Meteor.call('getUserServersToSubscribe', search, pageNo, sort,
      function (err, result) {
        if (!err) {
          Session.set('user_servers_search_result', result);
          Session.set('user_servers_search_error');
          $('#nick-status').show();
          $('#nick-status-error').hide();
          var data = result.data;
          var user_server_collection_ids = [];
          for (var i=0; i<data.length; i++) {
            user_server_collection_ids.push(data[i]._id);
          }
          Session.set('user_server_collection_ids', user_server_collection_ids);
        } else {
          Session.set('user_servers_search_error', 'OOPS! Something went wrong!');
          Session.set('user_servers_search_result');
          $('#nick-status').hide();
          $('#nick-status-error').show();
        }
        $('#chatlogs-loader').hide();
      }
    );
  }
};

var _getCurrentPage = function () {
  var result = Session.get('user_servers_search_result');
  if (result && result.pageNo) {
    return result.pageNo;
  }
  return 1;
};

var _getTotalPages = function () {
  var result = Session.get('user_servers_search_result');
  if (result && result.perPage && result.totalCount) {
    var perPage = result.perPage;
    var totalCount = result.totalCount;
    var count = parseInt(totalCount / perPage);
    if ((totalCount % perPage) > 0)
      count += 1;
    return count;
  }
  return 1;
}

Template.admin.helpers({
  /*
   * Returns channel logs found.
   */
  data: function () {
    var sort = Session.get('user_servers_search_sort') || {nick:1};
    return UserServers.find({}, {sort: sort});
  },

  showStatus: function (status) {
    if (status == 'connected')
      return 'Connected';
    else if (status == 'user_disconnected')
      return 'Disconnected';
    else if (status == 'connecting')
      return 'Connecting';
    else if (status == 'disconnecting')
      return 'Disconnecting';
  },

  statusOppositeAction: function (status) {
    if (status == 'connected')
      return 'Disconnect';
    else if (status == 'user_disconnected')
      return 'Connect';
    else if (status == 'connecting')
      return 'Connecting';
    else if (status == 'disconnecting')
      return 'Disconnecting';
  },

  showStatusClass: function (status) {
    if (status == 'connected' || status == 'user_disconnected')
      return 'btn-primary';
    else
      return '';
  },

  sortIcon: function (field) {
    var result = Session.get('user_servers_search_result');
    if (result && result.sort) {
      var sort = result.sort;
      if (typeof(sort[field]) !=='undefined') {
        if (sort[field] == 1)
          return 'fa fa-desc';
        else
          return 'fa fa-asc';
      } else {
        return 'fa fa-sort';
      }
    } else {
      return '';
    }
  },

  /**
   * Return current page in search result
   */
  currentPage: function () {
    return _getCurrentPage();
  },

  /**
   * Return total pages in search result
   */
  totalPages: function () {
    return _getTotalPages();
  },

  /**
   * Return errors in search result
   */
  errors: function () {
    var errors = Session.get('user_servers_search_error');
    if (errors)
      return errors;
  },

  showNextButton: function () {
    var currentPage = _getCurrentPage();
    var totalPages = _getTotalPages();
    if (currentPage < totalPages)
      return true;
    else
      return false;
  },

  showPreviousButton: function () {
    var currentPage = _getCurrentPage();
    if (currentPage > 1)
      return true;
    else
      return false;
  },
});
