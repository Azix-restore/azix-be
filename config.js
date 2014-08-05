var path = require('path');

module.exports = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 8000,
  dbhost: process.env.DBHOST || 'localhost',
  dbuser: 'azix',
  dbpassword: process.env.DBPASSWORD || null,
  dbname: 'azix',
  bareRepo: 'assets/bareRepo.git',
  repositories: process.env.NODE_ENV === 'prod' ? path.join(process.env.HOME, 'repos') : '/tmp/repos',
  ami: 'ami-0e36f866', // Ubuntu 12.04 LTS
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
