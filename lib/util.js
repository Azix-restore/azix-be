var files = require('./files.js');
var config = require('../config.js');
var db = require('../db/config.js');
var path = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
var git = require('gift');
var Q = require('q');

module.exports.error = error = function(err) {
  // why doesn't this end the response?
  console.log(err.message);
  res.send(500, err.message);
};

module.exports.clone = clone = function(dest, source) {
  var deferred = Q.defer();
  if (source === undefined) {
    source = config.bareRepo;
  }
  git.clone(source, dest, deferred.makeNodeResolver());
  return deferred.promise;
};

module.exports.cloneBare = function(dest) {
  var deferred = Q.defer();
  var mkdir = Q.denodeify(fs.mkdir);

  mkdir(path.dirname(dest))
    .catch(function(e) {
      if (e.errno === 47) {
        return;
      } else {
        error(e);
      }
    })
    .then(function() {
      ncp(config.bareRepo, dest, function(err) {
        if (err) {
          deferred.reject(new Error(err));
        } else {
          deferred.resolve(dest);
        }
      });
    })
    .catch(error);

  return deferred.promise;
};

module.exports.endpoint = function(file) {

  if (typeof file === 'object') {
    file = [file.user, file.project].join('/');
  }

  file = file.replace(/\.[^/.]+$/, '');
  file = file.split('/');
  file = file.slice(file.length - 2);
  file = file.join('/');
  return  'http://' + config.host + ':' + config.port + '/repos/' + file;
};

module.exports.repoFromEndpoint = repoFromEndpoint = function(endpoint) {
  endpoint = endpoint.split('/');
  endpoint = path.join.apply(null, endpoint.slice(endpoint.length - 2));
  return path.join(config.repositories, endpoint + '.git');
};

module.exports.validateObj = function(obj, properties) {
  for (var i = 0; i < properties.length; i++) {
    if (!obj.hasOwnProperty(properties[i])) {
      return false;
    }
  }
  return true;
};

module.exports.findRepo = function(obj) {
  var deferred = Q.defer();
  var query = {
    user: obj.user,
    project: obj.project
  };
  db.Repo.find(query, deferred.makeNodeResolver());
  return deferred.promise;
};

module.exports.findRunLog = function(obj, status) {
  status = status || 'all';
  var deferred = Q.defer();
  var query = {
    user: obj.user,
    project: obj.project
  };
  db.RunLog.find(query, function(err, data) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(filterRunLogs(data, status));
    }
  });
  return deferred.promise;
};

var filterRunLogs = function(runLogs, status) {
  var filters = {
    all: function(data) { return data; },
    running: function(data) {
      var result = [];
      data.forEach(function(x) {
        if (!x.completed) {
          result.push(x);
        }
      });
      return result;
    },
    completed: function(data) {
      var result = [];
      data.forEach(function(x) {
        if(x.completed) {
          result.push(x);
        }
      });
      return result;
    }
  };

  return filters[status](runLogs);
};

module.exports.currentCommit = function(endpoint) {
  var deferred = Q.defer();
  var path = repoFromEndpoint(endpoint);
  var repo = git(path);
  repo.current_commit(deferred.makeNodeResolver());
  return deferred.promise;
};
