var config = require('../config.js');
var AWS = require('aws-sdk');
var _ = require('underscore');

var awsConfig = {
  accessKeyId: config.awsAccessKeyId,
  secretAccessKey: config.awsSecretAccessKey,
  region: "us-east-1"
};

_.defaults(AWS.config, awsConfig);

var ec2Config = {
  ImageId: config.ami,
  InstanceType: 't1.micro',
  MinCount: 1,
  MaxCount: 1,
  KeyName: 'sd',
  SecurityGroupIds: ['sg-4c2eba24']
};

module.exports.AWS = AWS;
module.exports.ec2Config = ec2Config;
