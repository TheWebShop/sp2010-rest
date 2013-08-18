/*global describe, it */
'use strict';

var connect = require('connect');
var sp2010rest = require('../lib/sp2010-rest.js');
var app = connect()
  .use(sp2010rest(connect, 'test/lists'))
  .use(function(req, res) {
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({
      fell: 'through'
    }));
  })
  .listen(3000);


var request = require('supertest');

describe('Non REST requests should be ignored', function() {
  it('fall through', function(done) {
    request(app)
      .get('/random-route')
      .set('Accept', 'application/json')
      .expect(200, {
        fell: 'through'
      }, done);
  });
});

describe('GET /_vti_bin/ListData.svc', function() {
  it('should respond with a list of available lists', function(done) {
    request(app)
      .get('/_vti_bin/ListData.svc')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(JSON.stringify({
        d: {
          EntitySets: ['Browsers']
        }
      }), done);
  });
});

describe('GET /_vti_bin/ListData.svc/Browsers', function() {
  it('respond with the contents of a list', function(done) {
    request(app)
      .get('/_vti_bin/ListData.svc/Browsers')
      .set('Accept', 'application/json')
      .end(function(err, res) {

        done();
      });
  });
});