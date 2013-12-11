
/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , routes = require('./controllers')
  , http = require('http')
  , path = require('path')
  , api = require('./controllers/api/api.js')
  , admin = require('./controllers/admin/index.js')
  , adminValidate = require('./controllers/admin/validate/index.js')
  , registerRoutes = require('./lib/registerRoutes.js');

var auth = require('./lib/auth.js');


var app = express();

var staticMiddleware = express.static(path.join(__dirname, 'public'));

app.configure(function(){
  app.set('port', 3100);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //NOTE: view cache is turned off - performance may start to suffer
  app.set('view cache', false);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(staticMiddleware);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// jQuery.ajax({

//   url: '/admin/validate/jade',
//   data: {
//     jade: 'extends ../layout.jade\ndiv.woot\n  p booya',
//     path: 'asdf/temp.jade',
//   },
//   type: 'POST', 
//   success: function(data){
//     console.log('WOOT', data);
//   },
//   error: function(){
//     console.log('FAIL.', arguments);
//   }
// });

var staticRoutes = {
  '/': {
    get: routes.index
  },
  '/admin/validate/jade': {
    post: adminValidate.jade
  },
  '/admin': {
    get: admin.index
  },
  '/admin/staticPages': {
    //TODO: fix this so we can use a route like /admin/static/:pageName - .read() handles ALL and SINGLE pages.
    get: admin.staticPage.read,
    put: admin.staticPage.update,
    post: admin.staticPage.create,
    delete: admin.staticPage.del
  },
  '/admin/login': {
    get: admin.login,
    post: admin.doLogin
  },
  '/admin/tmpl': {
    get: admin.template.read
  }
};

var dynamicRoute = function(fileName, next){
  //only supports gets as of now

  // strip off first slash and replace subsequent slashes with :
  var parsedFileName = fileName.replace(/^\//,'').replace(/\//ig, ':');

  //if file exists
  var viewPath = __dirname + '/views/static/' + parsedFileName + '.jade';

  fs.exists(viewPath, function(exists){
    if(exists){
      next(null, viewPath);
    }
    else {
      console.error('Could not find template:', fileName);
      next('Page not found.');
    }
  });

};
// app.get('/*', routes.index);


var handleRoute = function(req, res, path, method){
  if(staticRoutes[path]){
    if(staticRoutes[path][method]){
      staticRoutes[path][method](req, res);
    }
    else {
      res.send(404);
    }
  }
  else if(/^\/(css|js|fonts|img)/i.test(path)) {
    staticMiddleware(req, res, function(){
      res.send(404);
    });
  }
  else {
    dynamicRoute(path, function(err, templatePath){
      if(err){
        res.send(404);
        return false;
      }
      res.render(templatePath, { 
        title: 'Beam Lending | ', 
        // company: company,
        // pageType: 'proposal' 
      });

    });
  }
};

app.all('/*', function(req, res){

  var path = req.path;
  var method = req.method.toLowerCase();

  //match all /admin paths except /admin/login
  var isAuthRequired = /^\/admin(?!\/login|\/tmpl)/ig.test(path);

  if(isAuthRequired){
    auth.isAuthenticated(req, res, function(err, isAuthenticated){
      console.log('IS isAuthenticated:', isAuthenticated);
      if(isAuthenticated === true){
        handleRoute(req, res, path, method);
      }
      else {
        console.log(err);
        res.format({
          html: function(){
            res.redirect('/admin/login');
          },
          json: function(){
            res.send(403);
          }
        });
      }
    });
  }
  else {
    // public route
    handleRoute(req, res, path, method);
  }

});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
