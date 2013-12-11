var auth = require('../../lib/auth.js');
var staticPage = require('./staticPage');

//angular templates
var template = {
  read: function(req, res){
    
    var templateName = req.query.name;

    res.render('admin/tmpl/' + templateName, {});

  }
};

exports.staticPage = staticPage;

exports.index = function(req, res){
  res.render('admin/index', {});
};

exports.login = function(req, res){
  res.render('admin/index', {});
};

exports.doLogin = function(req, res){
  auth.isAuthenticated(req, res, function(err, isAuthenticated){
    if(isAuthenticated === true){
      res.send(auth.createSuccessResponse());
    }
    else{
      res.send(auth.createFailedResponse());
    }
  });
};

exports.template = template;