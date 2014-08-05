var config = require('../config.js');
var mongoose = require('mongoose');
//var bcrypt = require('bcrypt');
var timestamps = require('mongoose-timestamp');
var Schema = mongoose.Schema;
var SALT_WORK_FACTOR = 10;


var dbConnection = function(config) {
  var result;
  if (config.dbpassword) {
    result = 'mongodb://' + config.dbuser + ':' +
      config.dbpassword + '@' + config.dbhost  + '/' + config.dbname;
  } else {
    result = 'mongodb://' + config.dbhost + '/' + config.dbname;
  }
  return result;
};
mongoose.connect(dbConnection(config));


var repoSchema = new Schema({
  user: { type: String, required: true },
  project: { type: String, required: true },
  endpoint: { type: String, required: true }
});
repoSchema.plugin(timestamps);
var Repo = mongoose.model('Repo', repoSchema);



var runLogSchema = new Schema({
  user: { type: String, required: true },
  project: { type: String, required: true },
  instanceId: { type: String },
  started: { type: Date, default: Date.now },
  startCommit: { type: String },
  completed: { type: Date },
  completeCommit: { type: String },
  ami: { type: String, required: true },
  instanceType: { type: String, required: true },
  code: { type: Number }
});
runLogSchema.plugin(timestamps);
var RunLog = mongoose.model('RunLog', runLogSchema);




//User Schema
var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true }
});

/*UserSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) return next();
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};*/
var User = mongoose.model('User', UserSchema);


module.exports.Repo = Repo;
module.exports.RunLog = RunLog;
module.exports.User = User;
