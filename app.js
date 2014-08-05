var config = require('./config.js');
var apiRouter = require('./routes/api.js');
var gitRouter = require('./routes/git.js');
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var app = express();


app.use(logger('combined'));
app.use(bodyParser.json());

app.use('/api', apiRouter);
app.use('/repos', gitRouter);

module.exports = app;

