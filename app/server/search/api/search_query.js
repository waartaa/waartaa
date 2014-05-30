SearchQuery = function (q) {

  this.q = q;

  this.qJSON = {};

  this.construct = function () {
    var qJSON = {
      "query": {
        "filtered": {
          "filter": {}
        }
      }
    };
    var filter = [];
    // Filter by server name
    filter.push({
      "term": {"server_name": this.q.serverName}
    });
    // Filter by channel name
    filter.push({
      "term": {"channel_name": '#' + this.q.channelName}
    });
    // Filter by from
    if (this.q.from) {
      filter.push({
        "term": {"from": this.q.from}
      });
    }
    // Filter by date range
    if (this.q.dateFrom && this.q.dateTo) {
      filter.push({
        "range": {
          "created": {
            "from": this.q.dateFrom,
            "to": this.q.dateTo
          }
        }
      });
    }
    qJSON.query.filtered.filter.and = filter;

    var query;
    // Search by message & nick
    if (this.q.message && this.q.to) {
      query = {
        "bool": {
          "must": [{
            "term": {"message": this.q.to}
          }, {
            "match": {"message": this.q.message}
          }],
          "should": {
            "match_phrase": {"message": this.q.message}
          }
        }
      };
    }
    // Search by message
    else if (this.q.message) {
      query = {
        "bool": {
          "should": [{
            "match": {"message": this.q.message}
          }, {
            "match_phrase": {"message": this.q.message}
          }]
        }
      };
    }
    // Search by nick
    else if (this.q.to) {
      query = {
        "term": {"message": this.q.to}
      };
    }
    // Match all
    else {
      query = {
        "match_all": {}
      };
    }
    qJSON.query.filtered.query = query;

    // Sort by date
    if (!this.q.message) {
      qJSON.sort = [{
        "created": {"order": "desc"}
      }];
      qJSON.track_scores = true;
    }

    this.qJSON = qJSON;

    return this;
  };

  this.execute = function () {
    var esClient = new elasticsearch.Client({
      host: CONFIG.ELASTIC_SEARCH_HOST
    });
    // Using future to make the prcoess synchronous
    var future = Npm.require('fibers/future');
    var waiter = future.wrap(esClient.search.bind(esClient));
    try {
      var data = waiter({
        index: 'channel_logs',
        from: (parseInt(this.q.page) - 1) * CONFIG.ELASTIC_SEARCH_DATA_LIMIT,
        size: CONFIG.ELASTIC_SEARCH_DATA_LIMIT,
        body: this.qJSON
      }).wait();
      return data;
    } catch(err) {
      return false;
    }
  };

};
