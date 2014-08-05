var util = require('./util.js');
var repo = require('./files.js').repoPath;
var db = require('../db/config.js');
var Q = require('q');

var initHandler = function(req, res) {
  /*
    Main handler for the POST received from the command line init command

    1. Receives data with client info
    2. Checks if project already exists
    3. Clones (forks?) base repo
    4. Adds Repo data to DB
    5. Sends back data to client { endpoint: repo endpoint }

    arguments:
    req, res
    req.body will be an object with { user, project }
    res.body will be { endpoint: repo endpoint }
   */

  validateInit(req.body)
    .catch(function(e) {
      res.send(400, e.message);
      throw e;
    })
    .then(initRepo)
    .then(function(data) {
      if (data.length) { data = data[0]; }
      res.send({ endpoint: data.endpoint });
    })
    .catch(function(e) {
      console.log(e);
      res.send(500, e.message);
    });

};

var initRepo = function(obj) {
  var deferred = Q.defer();
  var repoPath = repo(obj);

  util.cloneBare(repoPath)
    .then(function(dest) {
      var endpoint = util.endpoint(dest);
      new db.Repo({
        user: obj.user,
        project: obj.project,
        endpoint: endpoint
      }).save(deferred.makeNodeResolver());
    });

  return deferred.promise;
};

var validateInit = function(obj) {
  var deferred = Q.defer();
  var valid = util.validateObj(obj, ['user', 'project']);
  if (!valid) { deferred.reject(new Error('Invalid data')); }
  util.findRepo(obj)
    .then(function(data) {
      if (data.length) {
        deferred.reject(new Error('Project already exists'));
      } else {
        deferred.resolve(obj);
      }
    });
  return deferred.promise;
};


module.exports = initHandler;
