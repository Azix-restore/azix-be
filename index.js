var app = require('./app.js');
var config = require('./config.js');

app.listen(process.env.PORT || config.port);
console.log('listening on port', process.env.PORT || config.port);

