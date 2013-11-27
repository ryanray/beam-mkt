var fs = require('fs');
var dirs = [];
var VIEWS_DIR = '/views/static';
var TEMPLATE_EXTENSION = '.jade';
var index = require('../controllers');

//syncronous version
var walk = require('walk'),
    fs = require('fs');

// To be truly synchronous in the emitter and maintain a compatible api,
// the listeners must be listed before the object is created
var options = {
  listeners: {
    names: function (root, nodeNamesArray) {

    }, 
    directories: function (root, dirStatsArray, next) {
      next();
    },
    file: function (root, fileStats, next) {
      fs.readFile(fileStats.name, function () {
        next();
      });
    }, 
    errors: function (root, nodeStatsArray, next) {
      next();
    }
  }
};

var walker = walk.walkSync(process.cwd() + VIEWS_DIR, options);

var buildRoute = function(dir, file){
    var result = dir.split(VIEWS_DIR)[1];
    var re = new RegExp(TEMPLATE_EXTENSION,'ig');
    if(!re.test(file)){
        console.log('route not built!', dir, file);
        return false;
    }
    var fileName = file.split(TEMPLATE_EXTENSION)[0];
    fileName = (fileName === 'index.jade') ? '' : fileName;
    return dir.split(VIEWS_DIR)[1] + '/' + fileName;
};

var buildRoutes = function(filesAndDirs){
    var routes = [];

    filesAndDirs.forEach(function(item){
        item.files.forEach(function(file){
            var route = buildRoute(item.directory, file);
            if(route !== false && routes.indexOf(route) < 0){
                routes.push(route);
            }
        });
    });

    return routes;
};

exports.all = function(app){

  walker.on('names', function(root, stats, next){
    dirs.push({directory: root, files: stats});
  });

  walker.on('end', function(root, stats, next){
    var builtRoutes = buildRoutes(dirs);

    builtRoutes.forEach(function(route){
      console.log('Registering route: ' + route);
      app.get(route, index.staticRoute);
    });

    console.log(builtRoutes.length + ' routes registered!');

  });
};