(function () {
  "use strict";
  jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmine.getEnv().defaultTimeoutInterval = 20000;

  Template.stub('server_channels');
  Template.stub('server_channel_item');
  Template.stub('channel_menu');
  Template.stub('edit_server_channel');

  describe("Template.server_channels.channels", function () {

    it("asks for channels to be in alphabetical order, to not have last_updated field, to be active", function () {
      var someLocalCollectionCursor = {};
      UserChannels.find = function (selector, options) {
        expect(selector.user_server_id).toBe('xyz');
        expect(selector.active).toBe(true);
        expect(options.fields.last_updated).toBe(0);
        expect(options.sort.name).toBe(1);
        return someLocalCollectionCursor;
      }
      expect(Template.server_channels.channels('xyz')).toBe(someLocalCollectionCursor);
    });
 
  });

  describe("Template.server_channel_item.created", function () {

      var channel_id = 'xyz';

      var getLastAccessedChannelKey = function () {
        return "lastAccessedChannel-" + channel_id;
      };

      afterEach(function () {
        Session.set(getLastAccessedChannelKey(), undefined);
      });

      it("sets lastAccessedChannel-<channel-id> in session", function () {
        Template.server_channel_item.data = {_id: channel_id};
        Template.server_channel_item.created();
        var date_obj = new Date();
        var session_date_obj = Session.get(getLastAccessedChannelKey());
        expect(session_date_obj).not.toBeUndefined();
        expect(session_date_obj.toString()).toBe(date_obj.toString());
      });

  });

  describe("Template.server_channel_item.isChannelActive", function () {

    var set_room = function (roomtype, server_id, room_id) {
      var room = {
        roomtype: roomtype,
        server_id: server_id,
        room_id: room_id
      };
      Session.set('room', room);
    };

    afterEach(function () {
      Session.set('room', undefined);
    });

    it("returns true if session's roomtype is channel and server_id and room id is current template server id and room_id", function () {
      var server_id = 'xyz';
      var room_id = 'xyz1';
      set_room('channel', server_id, room_id);
      Template.server_channel_item.user_server_id = server_id;
      Template.server_channel_item._id = room_id;
      expect(Template.server_channel_item.isChannelActive()).toBe(true);
    });

    it("returns undefined if session's room is not set", function () {
      expect(Template.server_channel_item.isChannelActive()).toBe(undefined);
    });

    it("returns undefined if session's roomtype is not channel", function () {
      var server_id = 'xyz';
      var room_id = 'xyz1';
      set_room('server', server_id, room_id);
      Template.server_channel_item.user_server_id = server_id;
      Template.server_channel_item._id = room_id;
      expect(Template.server_channel_item.isChannelActive()).toBe(undefined);
    });

    it("returns undefined if session's server_id is not current template server_id", function () {
      var server_id = 'xyz';
      var room_id = 'xyz1';
      set_room('channel', 'xyz2', room_id);
      Template.server_channel_item.user_server_id = server_id;
      Template.server_channel_item._id = room_id;
      expect(Template.server_channel_item.isChannelActive()).toBe(undefined);
    });

    it("returns undefined if session's room_id is not current template room_id", function () {
      var server_id = 'xyz';
      var room_id = 'xyz1';
      set_room('channel', server_id, 'xyz2');
      Template.server_channel_item.user_server_id = server_id;
      Template.server_channel_item._id = room_id;
      expect(Template.server_channel_item.isChannelActive()).toBe(undefined);
    });

  });

  describe("Template.channel_menu [click .channel-remove] event", function () {

    var channel_id, channel, e;
    var emptyFunction = function () {};

    beforeEach(function () {
      channel_id = 'xyz';
      channel = {
        user_server_name: 'xyz1',
        name: 'xyz2'
      };
      e = {target: 'xyz3'};
      jQuery.data = function (key) {
        if(key == 'channel-id')
          return channel_id;
      };
      UserChannels.findOne = function (selector) {
        expect(selector._id).toBe(channel_id);
        return channel;
      };
      spyOn(Meteor, 'call');
    });

    afterEach(function () {
      channel_id = null;
      channel, e = {};
      jQuery.data = emptyFunction;
    });

    it("removes channel when .channel-remove is clicked", function () {
      Template.channel_menu.fireEvent('click .channel-remove', e);
      expect(Meteor.call).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalledWith('part_user_channel', channel.user_server_name, channel.name, true);
    });

  });

  describe("Template.channel_menu [click .toggleChannel]", function () {

    var channel_id, channel, e, status;
    var emptyFunction = function () {};

    beforeEach(function () {
      channel_id = 'xyz';
      channel = {
        user_server_name: 'xyz1',
        name: 'xyz2'
      };
      e = {currentTarget: 'xyz3'};
      e = jasmine.createSpyObj(e, ['preventDefault', 'stopPropagation']);
      jQuery.data = function (key) {
        if(key == 'channel-id')
          return channel_id;
      };
      jQuery.attr = function (key) {
        if(key == 'data-status')
          return status;
      };
      UserChannels.findOne = function (selector) {
        expect(selector._id).toBe(channel_id);
        return channel;
      };
      spyOn(Meteor, 'call');
    });

    afterEach(function () {
      channel_id = null;
      channel, e = {};
      jQuery.data = emptyFunction;
      jQuery.attr = emptyFunction;
    });

    it("clicking .toggleJoinChannel parts user channel if status is connected", function () {
      status = 'connected';
      Template.channel_menu.fireEvent('click .toggleJoinChannel', e);
      expect(e.preventDefault).toHaveBeenCalled();
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalledWith('part_user_channel', channel.user_server_name, channel.name, false);
    });

    it("clicking .toggleJoinChannel joins user channel if status is disconnected'", function () {
      status = 'disconnected';
      Template.channel_menu.fireEvent('click .toggleJoinChannel', e);
      expect(e.preventDefault).toHaveBeenCalled();
      expect(e.stopPropagation).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalled();
      expect(Meteor.call).toHaveBeenCalledWith('join_user_channel', channel.user_server_name, channel.name);
    });

  });

})();
