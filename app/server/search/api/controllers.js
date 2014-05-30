SearchController = RouteController.extend({

  makeResponse: function(isOK, data, err) {
    var resp;
    if (isOK) {
      var d = [];
      for(var i=0; i<data.hits.hits.length; i++)
        d.push(data.hits.hits[i]._source);
      resp = {
        status: true,
        results: {
          totalCount: data.hits.total,
          perPage: CONFIG.ELASTIC_SEARCH_DATA_LIMIT,
          data: d
        }
      }
    } else {
      resp = {
        status: false,
        error: err
      };
    }
    return resp;
  },

  onBeforeAction: function (pause) {
    // Apply user login check here
  },

  action: function () {
    var q = {
      message: this.params.message,
      from: this.params.from,
      to: this.params.to,
      dateFrom: this.params.dateFrom,
      dateTo: this.params.dateTo,
      page: this.params.page || 1,
      serverName: this.params.server_name,
      channelName: this.params.channel_name
    };

    var query = new SearchQuery(q);
    var data = query.construct().execute();
    var resp = this.makeResponse(true, data);
    this.response.writeHead(200, {'Content-Type': 'application/json'});
    this.response.end(JSON.stringify(resp));
  }

});
