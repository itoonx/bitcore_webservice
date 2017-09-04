process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./config.json');
var express = require('./config/express');
var app = express();

// start server
var port = config.port;
app.listen(port);
module.exports = app;
console.log('Server listenning on port : ' + port + '/');