var fs = require('fs');

var TEMPLATE_EXTENSION = '.jade';
var STATIC_DIR = process.cwd() + '/views/static/';

var createSuccessResponse = function(obj){
  obj = obj || {};
  obj.success = true;
  obj.isLoggedIn = true; //fix this
  obj.errors = [];
  return obj;
};

var createJadeSuccessResponse = function(jade){
  return createSuccessResponse({jade: jade});
};

var createErrorResponse = function(errObj, errors){
  errObj = errObj || {};
  errObj.success = false;
  errObj.errors = errors || [];
  return errObj;
};

var fileUtils = {
  serverFriendlyName: function(fileName){
    // strip off first slash and replace subsequent slashes with :
    // if(!/\.jade$/i.test(fileName)){
    //   fileName = fileName + TEMPLATE_EXTENSION;
    // }
    return (fileName && fileName.length) ? fileName.replace(/^\//,'').replace(/\//ig, ':') : '';
  },
  browserFriendlyName: function(fileName){
    if(!fileName){
      return '';
    }
    if(fileName && fileName[0] !== '/' && fileName[0] !== ':'){
      fileName = '/' + fileName;
    }
    fileName = fileName.replace(TEMPLATE_EXTENSION, '');
    return fileName.replace(/:/ig, '/');
  },
  viewPath: function(fileName){
    if(!fileName){
      return '';
    }
    return STATIC_DIR + fileName + TEMPLATE_EXTENSION;
  },
  exists: function(path, trueNext, falseNext){
    fs.exists(path, function(exists){
      if(exists){
        trueNext();
      }
      else {
        falseNext();
      }
      // next(exists);
    });
  }
  // flushCache: function(fileName, next){
  //   var parsedFileName = fileUtils.serverFriendlyName(fileName);
  //   var viewPath = fileUtils.viewPath(parsedFileName);
  // }
};

/**
 * getStaticPage();
 * @param fileName name of jade template
 * @param next callback
 * @return callback( err, content );
 */
var getStaticPage = function(fileName, next){
  // strip off first slash and replace subsequent slashes with :
  var parsedFileName = fileUtils.serverFriendlyName(fileName);
  var viewPath = fileUtils.viewPath(parsedFileName);

  fileUtils.exists( viewPath, function(){
    //trueNext
    fs.readFile(viewPath, 'utf8', function(err,data){
      if(err){
        console.log('ERROR READING LOCAL FILE::: ', err);
        next(err);
      }
      else {
        next(null, data);
      }
    });
  }, function(){
    //falseNext
    console.error('Could not find template:', fileName);
    next('Template not found:' + fileName);
  });

};


/**
 * createStaticPage();
 * @param fileName name of jade template to create
 * @param next callback
 * @return callback( err, content );
 */
var createStaticPage = function(fileName, content, next){

  var parsedFileName = fileUtils.serverFriendlyName(fileName);
  var viewPath = fileUtils.viewPath(parsedFileName);

  fileUtils.exists( viewPath, function(){
    //trueNext
    // file EXISTS so we can't create it
    console.error('Could not create file because it already exists:', fileName);
    next('Template already exists: ' + fileName, null);
  }, function(){
    //falseNext
    // file DOES NOT exist, so we're okay to create it
    fs.writeFile(viewPath, content, 'utf-8', function(err){
      if(err){
        console.log('ERROR SAVING FILE::: ', fileName);
        next(err, null);
      }
      else {
        next(null, content);
      }
    });
  });

};

/**
 * updateStaticPage();
 * @param fileName name of jade template to update(overwrite)
 * @param content - jade string
 * @param next callback
 * @return callback( err, content );
 */
var updateStaticPage = function(fileName, content, next){
  // strip off first slash and replace subsequent slashes with :
  var parsedFileName = fileUtils.serverFriendlyName(fileName);
  var viewPath = fileUtils.viewPath(parsedFileName);

  console.log('VIEWPATH:::', viewPath);

  fileUtils.exists( viewPath, function(){
    //trueNext
    // overwrite file!
    fs.writeFile(viewPath, content, 'utf-8', function(err){
      if(err){
        console.log('ERROR SAVING FILE::: ', fileName);
        next(err, null);
      }
      else {
        next(null, content);
      }
    });
  }, function(){
    //falseNext
    console.error('Could not update template:', fileName);
    next('Could not update find template to update:' + fileName);
  });

};


exports.read = function(req, res){
  var templateName = req.query.templateName;

  if(!templateName){
    exports.readAll(req, res);
    return false;
  }

  getStaticPage(fileUtils.serverFriendlyName(templateName), function(err, fileContent){
    if(err){
      res.send(createErrorResponse(null, err));
    }
    else {
      res.send(createJadeSuccessResponse(fileContent));
    }
  });
};

exports.create = function(req, res){

  //var response = {jade: null, errors: []};
  var templateName = req.body.templateName;
  var content = req.body.jade;

  //TODO: check for required params

  createStaticPage(fileUtils.serverFriendlyName(templateName), content, function(err, fileContent){
    if(err){
      res.send(createErrorResponse(null, err));
    }
    else {
      res.send(createJadeSuccessResponse(fileContent));
    }
  });

};

exports.update = function(req, res){

  var templateName = req.body.templateName;
  var content = req.body.jade;

  //TODO: check for required params

  updateStaticPage(templateName, content, function(err, fileContent){
    if(err){
      res.send(createErrorResponse(null, err));
    }
    else {
      res.send(createJadeSuccessResponse(fileContent));
    }
  });
};

exports.readAll = function(req, res){

  fs.readdir(STATIC_DIR,function(err,files){
    if (err) {
      res.send(createErrorResponse(null, err));
    }
    for(var i=0, l=files.length; i<l; i++){
      files[i] = fileUtils.browserFriendlyName(files[i]);
    }
    res.send(createSuccessResponse({files: files}));
  });

};

exports.del = function(req, res){

  var templateName = req.query.templateName;
  var parsedFileName = fileUtils.serverFriendlyName(templateName);

  if(!parsedFileName){
    console.log('Cant delete file: ' + templateName);
    res.send(createErrorResponse(null, 'Cant delete file: ' + templateName));
    return false;
  }

  fs.unlink(fileUtils.viewPath(parsedFileName), function (err) {
    if (err){
      res.send(createErrorResponse(null, err));
      return false;
    }
    console.log('successfully deleted ' + templateName);
    res.send(createSuccessResponse());
  });

};