waartaa.chat.helpers.chatLogsTableCreateHandler = function () {
  Meteor.setTimeout(updateHeight, 0);
};

waartaa.chat.helpers.isSameChatRoom = function (oldPath, newPath) {
  if (oldPath && oldPath.route.name == newPath.route.name) {
    if (oldPath.params.serverName != newPath.params.serverName)
      return false;
    if (oldPath.params.channelName != newPath.params.channelName)
      return false;
    if (oldPath.params.nick != newPath.params.nick)
      return false;
    return true;
  }
  return false;
};

waartaa.chat.helpers.chatLogsWaypointHandler = function () {
  var $scrollUpElem;
  var $scrollDownElem;
  var pageStack = [];
  var routerPath;
  var _reatimeChatlogsObserver;
  var pageStackLength = 3;

  function fetchNewerLogs (options) {
    var room = Session.get('room');
    var currentPath = Router.current();
    if (!(pageStack.length > 0))
      return;
    var params = {
      from: moment(pageStack[0]).format(),
      direction: 'down',
      limit: DEFAULT_LOGS_COUNT,
    };
    var path = _getChatroomPath(room, params);
    console.log(path);
    Router.go(path, {replaceState: true});
  }

  function _getOldestLogInRoom(room, createdSortOrder) {
    if (room) {
      if (room.roomtype == 'channel') {
        return ChannelLogs.findOne(
          {channel_name: room.channel_name},
          {sort: {created: createdSortOrder}}
        );
      } else if (room.roomtype == 'pm') {
        return PMLogs.findOne(
          {
            $or: [{from: room.nick}, {to_nick: room.nick}],
            server_id: room.server_id
          }, {sort: {created: createdSortOrder}});
      } else if (room.roomtype == 'server') {
        return UserServerLogs.findOne(
          {server_id: room.server_id}, {sort: {created: createdSortOrder}});
      }
    }
  }

  function _observeRealtimeChatlogs (room, oldestLog) {
    if (_reatimeChatlogsObserver) {
      _reatimeChatlogsObserver.stop();
    }
    var cursor;
    if (room.roomtype == 'channel')
      cursor = ChannelLogs.find({
        channel_name: room.channel_name, server_name: room.server_name,
        created: {$gt: oldestLog.created}
      });
    else if (room.roomtype == 'pm')
      cursor = PMLogs.findOne({
        $or: [{from: room.nick}, {to_nick: room.nick}],
        server_id: room.server_id,
        created: {$gt: oldestLog.created}
      });
    else if (room.roomtype == 'server')
      cursor = UserServerLogs.find({
        server_id: room.server_id, created: {$gt: oldestLog.created}});
    if (!cursor)
      return;
    _reatimeChatlogsObserver = cursor.observeChanges({
      added: function (id, fields) {
        var newLogs = Session.get('newRealtimeLogsSincePaginationStart');
        if (newLogs == undefined || newLogs >= DEFAULT_LOGS_COUNT) {
          _reatimeChatlogsObserver &&
            _reatimeChatlogsObserver.stop();
          if (typeof(newLogs) == "number") {
            Session.set('newRealtimeLogsSincePaginationStart');
            Session.set('showRealtimeLogs', false);
          }
          return;
        }
        Session.set('newRealtimeLogsSincePaginationStart', newLogs + 1);
      }
    });
  }

  function _getChatroomPath (room, params) {
    if (room.roomtype == 'channel')
      return Router.routes['chatRoomChannel'].path({
        serverName: room.server_name,
        channelName: room.channel_name.substr(1)
      }, {
        query: params
      });
    else if (room.roomtype == 'pm') {
      return Router.routes['chatRoomPM'].path({
        serverName: room.server_name,
        nick: room.nick
      }, {
        query: params
      });
    } else {
      return Router.routes['chatRoomServer'].path({
        serverName: room.server_name
      }, {
        query: params
      });
    }
  }

  function fetchOlderLogs (options) {
    var room = Session.get('room');
    var currentPath = Router.current();
    options = options || {};
    var createdSortOrder = 1;
    if (options.currentPage) {
      createdSortOrder = -1;
    }
    var oldestLog = _getOldestLogInRoom(room, createdSortOrder);
    if (!oldestLog)
      return;
    if (options.currentPage && oldestLog) {
      pageStack = new Array();
      pageStack.push(oldestLog.created);
      Session.set('paginationStartTimestamp', oldestLog.created);
      Session.set('newRealtimeLogsSincePaginationStart', 0);
      if (!waartaa.chat.helpers.isSameChatRoom(routerPath, currentPath))
        _observeRealtimeChatlogs(room, oldestLog);
    } else {
      pageStack = pageStack || new Array;
      if (pageStack.length > 0 &&
          oldestLog.created.toString() !=
          pageStack[pageStack.length - 1].toString()) {
        if (pageStack.length == pageStackLength) {
          pageStack.shift();
          Session.set('showRealtimeLogs', false);
        }
        pageStack.push(oldestLog.created);
        Session.set('paginationStartTimestamp', pageStack[0]);
      }
    }
    var params = {
      from: moment(oldestLog.created).format(),
      direction: 'up',
      limit: DEFAULT_LOGS_COUNT,
    };
    var path = _getChatroomPath(room, params);
    console.log(path);
    Router.go(path, {replaceState: true});
  }

  return {
    bind: function () {
      var newRouterPath = Router.current();
      if (!waartaa.chat.helpers.isSameChatRoom(routerPath, newRouterPath)) {
        pageStack = [];
      }
      if (newRouterPath && !newRouterPath.params.from) {
        Session.set('paginationStartTimestamp');
        Session.set('showRealtimeLogs');
      }
      if ($scrollUpElem)
        $scrollUpElem.waypoint('destroy');
      if ($scrollDownElem)
        $scrollDownElem.waypoint('destroy');
      $scrollUpElem = $('.chatlogs-scroll-up')
        .waypoint(function (direction) {
          if (direction == 'up') {
            fetchOlderLogs();
          }
        }, {
          context: '.chat-logs-container',
          offset: -10
        });
      $scrollDownElem = $('.chatlogs-scroll-down')
        .waypoint(function (direction) {
          var newRouterPath = Router.current();
          console.log(direction);
          if (direction == 'up') {
            if (!newRouterPath.params.from) {
              fetchOlderLogs({currentPage: true});
            }
          } else if (direction == 'down') {
            if (newRouterPath.params.from) {
              fetchNewerLogs();
            }
          }
        }, {
          context: '.chat-logs-container',
          offset: $('.chat-logs-container').outerHeight()
        });
      routerPath = newRouterPath;
    },
    handleScrolldownResponse: function (params) {

      function _getNewestPaginatedLog (params) {
        var room = Session.get('room');
        if (!room)
          return;
        var extraQueryOptions = {
          limit: parseInt(params.limit) || DEFAULT_LOGS_COUNT,
          sort: {created: 1},
          skip: (parseInt(params.limit) || DEFAULT_LOGS_COUNT) - 1
        };
        if (room.roomtype == 'channel')
          return ChannelLogs.findOne(
            {
              server_name: params.serverName,
              channel_name: '#' + params.channelName,
              created: {$gt: fromTimestamp}
            },
            extraQueryOptions
          );
        else if (room.roomtype == 'pm')
          return PMLogs.findOne(
            {
              server_name: params.serverName,
              $or: [{from: params.nick}, {to_nick: params.nick}],
              created: {$gt: fromTimestamp}
            }, extraQueryOptions
          );
        else if (room.roomtype == 'server')
          return UserServerLogs.findOne(
            {
              server_name: params.serverName,
              created: {$gt: fromTimestamp}
            }, extraQueryOptions
          )
      }

      if (params.direction == 'down' && params.from) {
        var fromTimestamp = new Date(params.from);
        var newestPaginatedLog = _getNewestPaginatedLog(params);
        if (!newestPaginatedLog) {
          if (fromTimestamp.toString() == (
              pageStack && pageStack.length > 0 && pageStack[0].toString())) {
            var path = _getChatroomPath(Session.get('room'), {});
            //pageStack = [];
            Router.go(path, {replaceState: true});
            return true;
          }
          return;
        }
        if (pageStack.length > 0 && pageStack[0].toString() != (
            newestPaginatedLog && newestPaginatedLog.created.toString())) {
          if (pageStack.length == 3)
            pageStack.pop();
          pageStack.unshift(newestPaginatedLog.created);
          Session.set('paginationStartTimestamp', pageStack[0]);
        }
      }
    }
  }
}();

var _displayLogs = function () {
  var timeoutIds = [];
  return function (template) {
    var currentPath = Router.current();
    var from = currentPath.params.from;
    if (currentPath.params.from) {
      var fromTimestamp = moment(from).toDate();
      if (template.data.last_updated < fromTimestamp) {
        $('.chat-logs-container').scrollTo('#chatlog-' + from.replace(
          /:/gi, '_').replace('+', 'plus'), 0,
          {offset: {top: -200}});
      } else {
        template.$('.chatlog-row').show();
        return;
      }
      if (timeoutIds.length) {
        while (timeoutIds.length > 0) {
          Meteor.clearTimeout(timeoutIds.pop());
        }
      }
      timeoutIds.push(
        Meteor.setTimeout(function () {
          timeoutIds = [];
          $('.chatlog-row:hidden').fadeIn(200, function () {
            if (from) {
              var fromTimestamp = moment(from).toDate();
              if (fromTimestamp > template.data.last_updated) {
                $('.chat-logs-container').scrollTo('#chatlog-' + from.replace(
                  /:/gi, '_').replace('+', 'plus'), 0,
                  {offset: {top: -200}});
              }
            }
          });
        }, 300)
      );
    } else {
      template.$('.chatlog-row').show();
    }
  };
}();

waartaa.chat.helpers.chatLogRowRenderedHandler = function () {
  var currentPath = Router.current();
  var last_log_id = Session.get('chatroom_last_log_id');
  var current_oldest_log_in_room = Session.get('oldest_log_in_room');
  _displayLogs(this);
  if (!currentPath.params.from)
    $('.chat-logs-container').scrollTop($('.chatlogs-table').height());
}

function _getOldestRealtimeLogForCurrentRoom () {
  var room = Session.get('room');
  if (room.roomtype == 'channel') {
    return ChannelLogs.findOne(
      {
        channel_name: room.channel_name,
        server_name: room.server_name
      }, {
        sort: {created: -1}, limit: 1,
        skip: DEFAULT_LOGS_COUNT - 1
      }
    );
  }
}

waartaa.chat.helpers.chatLogsContainerRendered = function () {
  updateHeight();
  $('.chat-logs-container').scrollTop($('.chatlogs-table').height());
}
