SearchController = (function () {

  var paramErrs = [];

  var validateParams = function(q) {
    paramErrs = [];
    var _isValidDate = function (dateString) {
      var regex_date = /^\d{4}\-\d{1,2}\-\d{1,2}$/;

      if (!regex_date.test(dateString)) {
          return false;
      }

      // Parse the date parts to integers
      var parts = dateString.split("-");
      var day = parseInt(parts[2], 10);
      var month = parseInt(parts[1], 10);
      var year = parseInt(parts[0], 10);

      // Check the ranges of month and year
      if (year < 1000 || year > 3000 || month == 0 || month > 12) {
        return false;
      }

      var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

      // Adjust for leap years
      if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {
          monthLength[1] = 29;
      }

      // Check the range of the day
      return day > 0 && day <= monthLength[month - 1];
    };

    var _compareDates = function (fromDate, toDate) {
      var fromDateObj = new Date(fromDate);
      var toDateObj = new Date(toDate);
      if(fromDateObj <= toDateObj)
        return true;
      else
        return false;
    };

    if (q.dateFrom && q.dateTo) {
      if (!_isValidDate(q.dateFrom)) {
        paramErrs.push("Invalid 'From' date.");
      }
      if (!_isValidDate(q.dateTo)) {
        paramErrs.push("Invalid 'To' date");
      }
      if (!_compareDates(q.dateFrom, q.dateTo)) {
        paramErrs.push("'From' date must be less than 'To' date.");
      }
    }

    if(paramErrs.length > 0)
      return false;

    return true;
  };

  var makeResponse = function(isOK, data, err) {
    var resp;
    if (isOK) {
      var d = [];
      for (var i=0; i<data.hits.hits.length; i++) {
        var doc = data.hits.hits[i];
        if (doc.highlight) {
          doc._source.message = doc.highlight.message[0];
        }
        d.push(doc._source);
      }
      resp = {
        status: true,
        results: {
          totalCount: data.hits.total,
          page: data.page,
          perPage: CONFIG.ELASTIC_SEARCH_DATA_LIMIT,
          took: data.took,
          logs: d
        }
      }
    } else {
      resp = {
        status: false,
        errors: err
      };
    }
    return resp;
  };

  var searchController = RouteController.extend({
    onBeforeAction: [function (pause) {
      // Apply user login check here
    }],

    action: function () {
      var resp;
      var q = {
        message: this.params.message,
        from: this.params.from,
        to: this.params.to,
        dateFrom: this.params.dateFrom || this.params.dateTo,
        dateTo: this.params.dateTo || this.params.dateFrom,
        page: this.params.page || 1,
        serverName: this.params.server_name,
        channelName: this.params.channel_name
      };

      if (validateParams(q)) {
        var query = new SearchQuery(q);
        var data = query.construct().execute();
        if(data === false)
          resp = makeResponse(false, undefined, ['Error connecting to search server.']);
        else {
          data.page = q.page;
          resp = makeResponse(true, data);
        }
      } else {
        resp = makeResponse(false, undefined, paramErrs);
      }
      this.response.writeHead(200, {'Content-Type': 'application/json'});
      this.response.end(JSON.stringify(resp));
    }
  });

  return searchController;
})();
