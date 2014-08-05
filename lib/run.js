var util = require('./util.js');
var config = require('../config.js');
var db = require('../db/config.js');
var AWS = require('./aws-config.js').AWS;
var ec2Config = require('./aws-config.js').ec2Config;
var EC2 = require('ec2-event');
var Q = require('q');
var git = require('gift');
var request = require('request');


var runHandler = function(req, res) {
  /*
    Main handler for the POST received from the command line run command.
    The commit shas are only used for validation on the ec2 instance.
    The db writes are spread out because doing them directly before/after
    vmStart was killing everything. So either it would write to the db and not
    start the EC2 instance, or start the EC2 instance but not write to the db.

    1. Receives data with client project info
    2. Checks to see if that client/project combo is already running a process
      - if so, return an error
    3. Start EC2 instance
    4. Create an entry in runLogs db with:
      - user, project, startCommit, startedtime, instanceId
    5. Send POST to EC2 instance with repo endpoint and commit sha?

    arguments:
    req, res
    req.body will be an object with { user, project }
   */

  validateRun(req.body)
    .catch(function(e) {
      res.status(400).send(e.message);
      throw e;
    })
    .then(function(data) {
      res.status(201).send('Process started');
      return data[0];
    })
    .then(dbWrite)
    .then(addCurrentCommit)
    .then(vmStart)
    .catch(function(e) {
      console.log(e);
      res.status(500).send(e.message);
    });

};

var validateRun = function(obj) {
  return Q.all([
    validateProject(obj),
    validateRunLog(obj)
  ]);
};

var validateProject = function(obj) {
  var deferred = Q.defer();
  util.findRepo(obj)
    .then(function(data) {
      if (!data.length) {
        deferred.reject(new Error("Project doesn't exist"));
      } else if (data.length > 1) {
        var err = new Error(
          "run.validateProject returned more than one repository"
        );
        deferred.reject(err);
      } else {
        deferred.resolve(data[0]);
      }
    });
  return deferred.promise;
};

var validateRunLog = function(obj) {
  var deferred = Q.defer();
  util.findRunLog(obj, 'running')
    .then(function(data) {
      if (data.length) {
        deferred.reject(new Error("Project already running"));
      } else {
        deferred.resolve(true);
      }
    });
  return deferred.promise;
};

var vmStart = function(obj) {
  var deferred = Q.defer();
  var ec2 = new EC2(ec2Config);

  ec2.on('starting', function() {
    obj.instanceId = ec2.instanceIds[0];
    obj.save(function(err) {
      if (err) {
        console.log(err);
      }
    });
  });

  ec2.on('running', function() {
    ec2.describe()
      .then(function(data) {
        var publicIp = data.Reservations[0].Instances[0].PublicDnsName;
        var postData = {
          instanceId: ec2.instanceIds[0],
          endpoint: util.endpoint(obj),
          startCommit: obj.startCommit,
          finalEndpoint: 'http://' + config.host + ':' + config.port + '/api/end'
        };
        var options = {
          method: 'POST',
          url: 'http://' + publicIp + ':8001/run',
          json: postData
        };
        return forceRequest(options);
      });
  });

  ec2.start();

  return deferred.promise;
};


var forceRequest = function(options) {
  /*
    This is really hacky but it seems like the EC2 instance is starting and
    the "running" event is firing before upstart has started the node server.
    So we just keep on sending the request until it goes through.
  */
  var deferred = Q.defer();
  request(options, function(err) {
    if (err) {
      setTimeout(function() { forceRequest(options); }, 1000);
    } else {
      deferred.resolve(true);
    }
  });
  return deferred.promise;
};


var addCurrentCommit = function(obj) {
  var deferred = Q.defer();
  obj = obj[0];
  obj.endpoint = util.endpoint(obj);
  util.currentCommit(obj.endpoint)
    .then(function(commit) {
      obj.startCommit = commit.id;
      deferred.resolve(obj);
    })
    .catch(function(e) {
      deferred.reject(new Error(e));
    });
  return deferred.promise;
};

var dbWrite = function(obj) {
  var deferred = Q.defer();
  new db.RunLog({
    user: obj.user,
    project: obj.project,
    ami: config.ami,
    instanceType: ec2Config.InstanceType,
  }).save(deferred.makeNodeResolver());
  return deferred.promise;
};

module.exports = runHandler;
