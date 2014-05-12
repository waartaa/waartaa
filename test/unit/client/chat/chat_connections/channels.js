(function () {
  "use strict";
  jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmine.getEnv().defaultTimeoutInterval = 20000;

  Template.stub('server_channels');
  Template.stub('server_channel_item');
  Template.stub('channel_menu');
  Template.stub('edit_server_channel');

  describe("Template.server_channels.channels", function () {
    
    it("asks for channels to be in alphabetical order, to not have last_updated field, to be active", function () {
      var someLocaliCollectionCursor = {};
      UserChannels.find = function (selector, options) {
        expect(selector.user_server_id).toBe('xyz');
        expect(selector.active).toBe(true);
        expect(options.fields.last_updated).toBe(0);
        expect(options.sort.name).toBe(1);
        return someLocaliCollectionCursor;
      }
      expect(Template.server_channels.channels('xyz')).toBe(someLocaliCollectionCursor);
    });
 
  });

})();
