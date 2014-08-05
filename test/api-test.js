var mocha = require('mocha');
var request = require('supertest');

var app = require('../app.js');

describe('/api', function() {
  describe('POST /init', function() {

    it('responds with json', function(done) {
      request(app)
        .post('/api/init')
        .send({
          user: (new Date()).getTime().toString(),
          project: (new Date()).getTime().toString()
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201, done);
    });

    it('responds with a repo endpoint', function(done) {
      request(app)
        .post('/api/init')
        .send({
          user: (new Date()).getTime().toString(),
          project: (new Date()).getTime().toString()
        })
        .set('Accept', 'application/json')
        .expect(function(res) {
          if (!res.body.hasOwnProperty('endpoint')) {
            return 'response doesnt have an endpoint property';
          }
        })
        .expect(/repos/)
        .expect(201, done);
    });

    it('responds with a 400 when a project already exists', function(done) {
      var now = (new Date()).getTime().toString();
      request(app)
        .post('/api/init')
        .send({ user: now, project: now })
        .end(function() {
          request(app)
            .post('/api/init')
            .send({ user: now, project: now })
            .expect(/Project already exists/)
            .expect(400, done);
        });
    });

  });
});
