'use strict';

var connect = require('connect');
var sp2010rest = require('../lib/sp2010-rest.js');

connect()
  .use(sp2010rest(connect, 'test/lists'))
  .use(function(req, res){
    res.end(JSON.stringify({ fell: 'through' }));
  })
  .listen(3000);


var APIeasy = require('api-easy');
var suite = APIeasy.describe('SharePoint REST');

suite.use('localhost', 3000)
  .setHeader('Content-Type', 'application/json')

  .discuss('Non REST requests should be ignore')
  .path('/birds')
  .get().expect({ fell: 'through' })
  .undiscuss().unpath()

  .discuss('but if you make a rest call')
  .path('/_vti_bin/ListData.svc')
  .get().expect(200)

  .export(module);
