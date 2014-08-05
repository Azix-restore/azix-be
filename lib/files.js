var path = require('path');
var repositories = require('../config.js').repositories;

module.exports.repoPath = function(username, project) {
  if (arguments[1] === undefined) {
    // So that this will take an object with { user, project }
    project = username.project;
    username = username.user;
  }
  return path.join(repositories, username, project + '.git');
};
