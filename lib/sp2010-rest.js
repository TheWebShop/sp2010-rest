/*
 * sp2010-rest
 * https://github.com/TheWebShop/sp2010-rest
 *
 * Copyright (c) 2013 Kevin Attfield
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(connect, dir) {
  var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    lists = {};

  // fs requires the base path to be absolute.
  var listDir = path.resolve(dir);

  // populate lists with any json files in ./lists
  fs.readdirSync(listDir).forEach(function(listName) {
    var isJson = listName.indexOf('.json', listName.length - 5) !== -1;
    if (!isJson) return;
    var list = require(listDir + '/' + listName);

    // support naked arrays or actual sp2010 rest scrapes
    if (list.d && list.d.results) list = list.d.results;

    lists[listName.replace(/\.json/i, '')] = list;
  });

  var getListItem = function(req, res, params, splats) {
    var list = lists[params.list];
    if (!list) return noList(params.list, res);

    var item = _.find(list, function(val) {
      return val.Id == params.id;
    });
    if (!item) return noItem(params.list, res);

    var body = JSON.stringify({
      d: item
    });

    //res.setHeader('Content-Length', body.length);
    res.end(body);
  };
  var getList = function(req, res, params, splats) {
    var list = lists[params.list];
    var orderby = req.query.$orderby;
    var filter = req.query.$filter;
    var skip = parseInt(req.query.$skip, 10) || 0;
    var top = parseInt(req.query.$top, 10);

    if (filter) list = _.filter(list, function(record) {
      return true;
    });

    if (typeof orderby === 'string') {
      var re = /(\S+) ?(asc|desc)?/;
      var match = orderby.match(re);
      var direction = match[2] || 'asc';
      orderby = match[1];

      if (_.has(list[0], orderby)) {
        list = list.sort(function(a, b) {
          a = a[orderby] || '';
          b = b[orderby] || '';

          a = a.toString().toUpperCase();
          b = b.toString().toUpperCase();

          if (direction === 'asc') return a > b ? 1 : a < b ? -1 : 0;
          return a > b ? -1 : a < b ? 1 : 0;
        });
      } else {
        res.send(noProp(orderby));
      }
    }

    list = top ? list.slice(skip, skip + top) : list.slice(skip);
    if (top == 1) {
      params.id = list[0].Id;
      return getListItem(req, res, params, splats);
    }
    var body = JSON.stringify({
      d: {
        results: list
      }
    });
    //console.log(body.length) return
    //res.setHeader('Content-Length', body.length);
    res.end(body);
  };
  var getLists = function(req, res, params, splats) {
    var available = [];

    for (var listName in lists) {
      available.push(listName);
    }
    var body = JSON.stringify({
      d: {
        EntitySets: available
      }
    });

    res.setHeader('Content-Length', body.length);
    res.end(body);
  };

  var router = new require('routes').Router();
  router.addRoute('/_vti_bin/listData.svc/:list/:id', getListItem);
  router.addRoute('/_vti_bin/listData.svc/:list', getList);
  router.addRoute('/_vti_bin/listData.svc', getLists);

  return connect()
    .use(connect.query())
    .use(function(req, res, next) {
      var url = req.url;
      url = trimSlash(url);
      url = trimSubsite(url);
      url = normalizeIdReq(url);
      url = trimQuery(url);

      var route = router.match(url);

      if (route) {
        route.fn(req, res, route.params, route.splats);
      } else {
        next();
      }
    });
};
// remove trailing slash

function trimSlash(str) {
  return (str.substr(-1) === '/' && str.length > 1) ? str.slice(0, -1) : str;
}
// ignore subsite

function trimSubsite(str) {
  return str.replace(/(.*)(\/_vti_bin\/ListData\.svc)(.*)/i, '$2$3');
}
// remove query string

function trimQuery(str) {
  var queryStart = str.indexOf('?');

  return (queryStart === -1) ? str : str.substring(0, str.indexOf('?'));
}
// separate list name and id for easier routing
// :list(:id) -> :list/:id

function normalizeIdReq(str) {
  var re = /_vti_bin\/listData.svc\/([^\(\/]+)\((\d+)\)/i;
  var match = str.match(re);

  return match ? '/_vti_bin/listData.svc/' + match[1] + '/' + match[2] : str;
}


function noProp(prop, res) {
  var body = JSON.stringify({
    error: {
      code: '',
      message: {
        lang: 'en-US',
        value: "No property '" + prop + "' exists in type 'Microsoft.SharePoint.Linq.DataServiceEntity' at position 0."
      }
    }
  });

  res.setHeader('Content-Length', body.length);
  res.end(body);
}

function noList(listName, res) {
  var body = JSON.stringify({
    error: {
      code: '',
      message: {
        lang: 'en-US',
        value: "Resource not found for the segment '" + listName + "'."
      }
    }
  });

  res.setHeader('Content-Length', body.length);
  res.end(body);
}

function noItem(listName, res) {
  var body = JSON.stringify({
    "error": {
      "code": "",
      "message": {
        "lang": "en-US",
        "value": "Resource not found for the segment '" + listName + "'."
      }
    }
  });
  res.setHeader('Content-Length', body.length);
  res.end(body);
}