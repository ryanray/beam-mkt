
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./controllers')
  , http = require('http')
  , path = require('path')
  , api = require('./controllers/api/api.js')
  , registerRoutes = require('./lib/registerRoutes.js');

var app = express();

app.configure(function(){
  app.set('port', 3100);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


//CALL BEFORE REGISTERING OTHER ROUTES
registerRoutes.all(app);


app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
