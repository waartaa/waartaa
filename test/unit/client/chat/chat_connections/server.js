(function () {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmine.getEnv().defaultTimeoutInterval = 20000;

  Template.stub('add_server_channel');
  Template.stub('server_menu');
  Template.stub('chat_connection_server');

  var emptyFunction = function () {};

  describe("Template.chat_connection_server [click .server-room] [click .server-link] events", function () {

    var room, roomtype, e, room_id,
      server_id, channel_id, nick, server, channel;

    var set_room = function (roomtype, name, value) {
      room = {};
      room['roomtype'] = roomtype;
      room[name] = value;
      Session.set('room', room);
    };

    beforeEach(function () {
      e = {target: 'xyz0'};
      e = jasmine.createSpyObj(e, ['stopPropagation']);
      jQuery.parents = function (key) {
        if(key == '.btn-group')
          return [];
        if(key == '.server')
          return jQuery;
      };
      jQuery.parent = function () {
        return jQuery;
      };
      jQuery.hasClass = function (key) {
        if(key == 'active')
          return true;
      };
      jQuery.removeClass = emptyFunction;
      jQuery.data = function (key) {
        if(key == 'server-id')
          return server_id;
        if(key == 'id')
          return channel_id;
        if(key == 'nick')
          return nick;
        if(key == 'roomid')
          return room_id;
        if(key == 'roomtype')
          return roomtype;
      };
      Meteor.setTimeout = function (callback, t) {
        setTimeout(callback, t);
      };
      jasmine.Clock.useMock();
      spyOn(waartaa.chat.helpers, 'setCurrentRoom');
    });

    afterEach(function () {
      room_id, server_id, channel_id, nick = null;
      room, e, channel, server = {};
      jQuery.parents, jQuery.parent, jQuery.data = emptyFunction;
      Session.set('room', undefined);
    });

    it("sets current room to server when clicked on a server room", function () {
      server_id = 'xyz';
      server = {name: 'xyz1'};
      roomtype = 'server';
      set_room(roomtype, 'server_id', server_id);
      UserServers.findOne = function (selector) {
        expect(selector._id).toBe(server_id);
        return server;
      };
      Template.chat_connection_server.fireEvent('click .server-room', e);
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(Session.get('user_server_log_count_' + server_id)).toBe(DEFAULT_LOGS_COUNT);
      expect(waartaa.chat.helpers.setCurrentRoom).not.toHaveBeenCalled();
      jasmine.Clock.tick(201);
      expect(waartaa.chat.helpers.setCurrentRoom).toHaveBeenCalled();
      expect(waartaa.chat.helpers.setCurrentRoom)
        .toHaveBeenCalledWith({
          roomtype: roomtype,
          server_id: server_id,
          server_name: server.name
        });
    });

    it("sets current room to channel when clicked on a channel room", function () {
      channel_id = 'xyz';
      server_id = 'xyz1'
      channel = {
        name: 'xyz2',
        user_server_name: 'xyz3'
      };
      roomtype = 'channel';
      set_room(roomtype, 'channel_id', channel_id);
      UserChannels.findOne = function (selector) {
        expect(selector._id).toBe(channel_id);
        return channel;
      };
      Template.chat_connection_server.fireEvent('click .server-room', e);
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(Session.get('user_channel_log_count_' + channel_id)).toBe(DEFAULT_LOGS_COUNT);
      expect(waartaa.chat.helpers.setCurrentRoom).not.toHaveBeenCalled();
      jasmine.Clock.tick(201);
      expect(waartaa.chat.helpers.setCurrentRoom).toHaveBeenCalled();
      expect(waartaa.chat.helpers.setCurrentRoom)
        .toHaveBeenCalledWith({
          roomtype: roomtype,
          server_id: server_id,
          channel_id: channel_id,
          channel_name: channel.name,
          server_name: channel.user_server_name
        });
    });

    it("set current room to pm when clicked on a pm room", function () {
      room_id = 'xyz';
      server_id = 'xyz1';
      nick = 'xyz2';
      server = {name: 'xyz3'};
      roomtype = 'pm';
      set_room(roomtype, 'room_id', room_id);
      UserServers.findOne = function (selector) {
        expect(selector._id).toBe(server_id);
        return server;
      };
      Template.chat_connection_server.fireEvent('click .server-room', e);
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(Session.get('pmLogCount-' +  room_id)).toBe(DEFAULT_LOGS_COUNT);
      expect(waartaa.chat.helpers.setCurrentRoom).not.toHaveBeenCalled();
      jasmine.Clock.tick(201);
      expect(waartaa.chat.helpers.setCurrentRoom).toHaveBeenCalled();
      expect(waartaa.chat.helpers.setCurrentRoom)
        .toHaveBeenCalledWith({
          roomtype: roomtype,
          server_id: server_id,
          room_id: room_id,
          server_name: server.name,
          nick: nick
        });
    });

    it("waarta.chat.helpers.setCurrentRoom is not called when session room is not set", function () {
      Template.chat_connection_server.fireEvent('click .server-room', e);
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(waartaa.chat.helpers.setCurrentRoom).not.toHaveBeenCalled();
      jasmine.Clock.tick(201);
      expect(waartaa.chat.helpers.setCurrentRoom).toHaveBeenCalled();
    });

    it("waarta.chat.helpers.setCurrentRoom is not called when session room.roomtype is not channel or pm or server", function () {
      Template.chat_connection_server.fireEvent('click .server-room', e);
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(waartaa.chat.helpers.setCurrentRoom).not.toHaveBeenCalled();
      jasmine.Clock.tick(201);
      expect(waartaa.chat.helpers.setCurrentRoom).toHaveBeenCalled();
    });

  });

  describe("Template.chat_connection_server.created", function () {

    var server_id = 'xyz';

    var getLastAccessedServerKey = function () {
      return 'lastAccessedServer-' + server_id;
    };

    afterEach(function () {
      Session.set(getLastAccessedServerKey(), undefined);
    });

    it("sets last accessed server time in session", function () {
      Template.chat_connection_server.data = {_id: 'xyz'};
      Template.chat_connection_server.created();
      var date_obj = new Date();
      var session_date_obj = Session.get(getLastAccessedServerKey());
      expect(session_date_obj).not.toBeUndefined();
      expect(session_date_obj.toString()).toBe(date_obj.toString());
    });

  });

  describe("Template.chat_connection_server.isServerActive", function () {

    var set_room = function (server_id) {
      var room = {server_id: server_id};
      Session.set('room', room);
    };

    afterEach(function () {
      Session.set('room', undefined);
    });

    it("returns true if session's room server_id is current template's server id", function () {
      var server_id = 'xyz';
      set_room(server_id);
      Template.chat_connection_server._id = server_id;
      expect(Template.chat_connection_server.isServerActive()).toBe(true);
    });

    it("returns undefined if session's room is undefined", function () {
      var server_id = 'xyz';
      Template.chat_connection_server._id = server_id;
      expect(Template.chat_connection_server.isServerActive()).toBeUndefined();
    });

    it("returns undefined if session's room server_id is not current template's server_id", function () {
      var server_id = 'xyz';
      set_room('xyz1');
      Template.chat_connection_server._id = server_id;
      expect(Template.chat_connection_server.isServerActive()).toBeUndefined();
    });

  });

  describe("Template.server_menu [click .server-remove] event", function () {

    var server_id, server, e;

    beforeEach(function () {
      server_id = 'xyz';
      server = {name: 'xyz1'};
      e = {target: 'xyz2'};
      jQuery.data = function (key) {
        if(key == 'server-id')
          return server_id;
      }
      UserServers.findOne = function (selector) {
        expect(selector._id).toBe(server_id);
        return server;
      }
      spyOn(Meteor, 'call');
    });

    afterEach(function () {
      server_id = null;
      server, e = {};
      jQuery.data = emptyFunction;
    });

    it("quits user server when .server-remove is clicked", function () {
      Template.server_menu.fireEvent('click .server-remove', e);
      expect(Meteor.call).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalledWith('quit_user_server', server.name, true);
    });

  });

  describe("Template.server_menu [click .toggleJoinServer] event", function () {

    var server_id, server, status, e;

    beforeEach(function () {
      server_id = 'xyz';
      server = {name: 'xyz1'};
      e = {currentTarget: 'xyz2'};
      e = jasmine.createSpyObj(e, ['preventDefault', 'stopPropagation']);
      jQuery.data = function (key) {
        if(key == 'server-id')
          return server_id;
      };
      jQuery.attr = function (key) {
        if(key == 'data-status')
          return status;
      };
      UserServers.findOne = function (selector) {
        expect(selector._id, server_id);
        return server;
      };
      spyOn(Meteor, 'call');
    });

    afterEach(function () {
      server_id, status = null;
      server, e = {};
    });

    it("clicking .toggleJoinServer does nothing if user server is not found", function () {
      server = null;
      Template.server_menu.fireEvent('click .toggleJoinServer', e);
      expect(e.preventDefault).toHaveBeenCalled();
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(Meteor.call).not.toHaveBeenCalled();
    });

    it("clicking .toggleJoinServer quits user server if status is connected", function () {
      status = 'connected';
      Template.server_menu.fireEvent('click .toggleJoinServer', e);
      expect(e.preventDefault).toHaveBeenCalled();
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalledWith('quit_user_server', server.name, false);
    });

    it("clicking .toggleJoinServer joins user server if status is disconnected", function () {
      status = 'disconnected';
      Template.server_menu.fireEvent('click .toggleJoinServer', e);
      expect(e.preventDefault).toHaveBeenCalled();
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalledWith('join_user_server', server.name);
    });

  });

  describe("Template.add_server_channel [submit form] event", function () {

    var server_id, server, e, data;

    beforeEach(function () {
      server_id = 'xyz';
      server = {name: 'xyz1'};
      e = {target: 'xyz2'};
      e = jasmine.createSpyObj(e, ['preventDefault', 'stopPropagation']);
      data = {names: '#xyz3, #xyz4'};
      jQuery.parents = function (selector) {
        return jQuery;
      };
      jQuery.data = function (key) {
        if(key == 'server-id')
          return server_id;
      };
      jQuery.serializeArray = function () {
        return [{
          name: 'names',
          value: data.names
        }];
      };
      $.each = function (d, callback) {
        for(var i=0; i<d.length; i++) {
          callback(i, d[i]);
        }
      };
      jQuery.modal = function (key) {};
      UserServers.findOne = function (selector) {
        expect(selector._id, server_id);
        return server;
      };
      spyOn(Meteor, 'call');
      spyOn(jQuery, 'modal');
    });

    afterEach(function () {
        server_id = null;
        server, e, data = {};
        jQuery.parents, jQuery.data,
          jQuery.serializeArray, $.each, jQuery.modal = emptyFunction;
    });

    it("joins a new channel when form is submitted", function () {
      Template.add_server_channel.fireEvent('submit form', e);
      expect(e.preventDefault).toHaveBeenCalled();
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalledWith('join_user_channel', server.name, data.names);
      expect(jQuery.modal).toHaveBeenCalled();
      expect(jQuery.modal).toHaveBeenCalledWith('hide');
    });

  });

  describe("updateUnreadLogsCount", function () {

    var unread_logs_count_key = 'xyz';
    var last_accessed_key = 'xyz1';

    afterEach(function () {
      Session.set(last_accessed_key, undefined);
      Session.set(unread_logs_count_key, undefined);
    });

    it("returns 1 if last_updated > last_accessed and increase unread logs count by 1 if update_session true", function () {
      var last_updated = 4321;
      var update_session = true;
      var last_accessed = 1234;
      var unread_logs_count = 1;
      Session.set(last_accessed_key, last_accessed);
      Session.set(unread_logs_count_key, 1);
      expect(updateUnreadLogsCount(unread_logs_count_key, last_accessed_key, last_updated, update_session)).toBe(1);
      expect(Session.get(unread_logs_count_key)).toBe(unread_logs_count+1);
    });

    it("returns 1 if last_updated > last_accessed and unread logs count remain same if update_session false", function () {
      var last_updated = 4321;
      var update_session = false;
      var last_accessed = 1234;
      var unread_logs_count = 1;
      Session.set(last_accessed_key, last_accessed);
      Session.set(unread_logs_count_key, 1);
      expect(updateUnreadLogsCount(unread_logs_count_key, last_accessed_key, last_updated, update_session)).toBe(1);
      expect(Session.get(unread_logs_count_key)).toBe(unread_logs_count);
    });

    it("returns 1 if last_updated > last_accessed and sets unread logs count to 1 if unread_logs_count is not set", function () {
      var last_updated = 4321;
      var update_session = true;
      var last_accessed = 1234;
      Session.set(last_accessed_key, last_accessed);
      expect(updateUnreadLogsCount(unread_logs_count_key, last_accessed_key, last_updated, update_session)).toBe(1);
      expect(Session.get(unread_logs_count_key)).toBe(1);
    });

    it("returns 1 if last_updated > last_accessed and doesn't set unread logs count if update session is false and unread logs count is not set", function () {
      var last_updated = 4321;
      var update_session = false;
      var last_accessed = 1234;
      Session.set(last_accessed_key, last_accessed);
      expect(updateUnreadLogsCount(unread_logs_count_key, last_accessed_key, last_updated, update_session)).toBe(1);
      expect(Session.get(unread_logs_count_key)).toBeUndefined();
    });

    it("returns 0 if last_updated > last_accessed", function () {
      var last_updated = 1234;
      var last_accessed = 4321;
      var update_session = true;
      Session.set(last_accessed_key, last_accessed);
      expect(updateUnreadLogsCount(unread_logs_count_key, last_accessed_key, last_updated, update_session)).toBe(0);
    });

  });

  describe("updateUnreadMentionsCount", function () {

    var unread_mentions_count_key = 'xyz';
    var last_accessed_key = 'xyz1';

    afterEach(function () {
      Session.set(last_accessed_key, undefined);
      Session.set(unread_mentions_count_key, undefined);
    });

    it("returns 1 if last_updated > last_accessed and increase unread mentions count by 1 if update_session true", function () {
      var last_updated = 4321;
      var update_session = true;
      var last_accessed = 1234;
      var unread_mentions_count = 1;
      Session.set(last_accessed_key, last_accessed);
      Session.set(unread_mentions_count_key, 1);
      expect(updateUnreadMentionsCount(unread_mentions_count_key, last_accessed_key, last_updated, update_session)).toBe(1);
      expect(Session.get(unread_mentions_count_key)).toBe(unread_mentions_count+1);
    });

    it("returns 1 if last_updated > last_accessed and unread mentions count remain same if update_session false", function () {
      var last_updated = 4321;
      var update_session = false;
      var last_accessed = 1234;
      var unread_mentions_count = 1;
      Session.set(last_accessed_key, last_accessed);
      Session.set(unread_mentions_count_key, 1);
      expect(updateUnreadMentionsCount(unread_mentions_count_key, last_accessed_key, last_updated, update_session)).toBe(1);
      expect(Session.get(unread_mentions_count_key)).toBe(unread_mentions_count);
    });

    it("returns 1 if last_updated > last_accessed and sets unread mentions count to 1 if unread_mentions_count is not set", function () {
      var last_updated = 4321;
      var update_session = true;
      var last_accessed = 1234;
      Session.set(last_accessed_key, last_accessed);
      expect(updateUnreadMentionsCount(unread_mentions_count_key, last_accessed_key, last_updated, update_session)).toBe(1);
      expect(Session.get(unread_mentions_count_key)).toBe(1);
    });

    it("returns 1 if last_updated > last_accessed and doesn't set unread mentions count if update session is false and unread mentions count is not set", function () {
      var last_updated = 4321;
      var update_session = false;
      var last_accessed = 1234;
      Session.set(last_accessed_key, last_accessed);
      expect(updateUnreadMentionsCount(unread_mentions_count_key, last_accessed_key, last_updated, update_session)).toBe(1);
      expect(Session.get(unread_mentions_count_key)).toBeUndefined();
    });

    it("returns 0 if last_updated > last_accessed", function () {
      var last_updated = 1234;
      var last_accessed = 4321;
      var update_session = true;
      Session.set(last_accessed_key, last_accessed);
      expect(updateUnreadMentionsCount(unread_mentions_count_key, last_accessed_key, last_updated, update_session)).toBe(0);
    });

  });

})();
