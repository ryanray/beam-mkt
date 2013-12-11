var v = require('../../../lib/jadeValidator.js');
// var html = 'extends ../layout.jade\ndiv.woot\n  p booya';

//THIS NEEDS TO CHANGE
var STATIC_DIR = process.cwd() + '/views/static/';

exports.jade = function(req, res){

  var jade = req.body.jade;
  var path = req.body.path;
  var response = {success: false, errors: []};

  if(!jade || !path){
    if(!jade){
      response.errors.push('Missing jade template.');
    }
    if(!path){
      response.errors.push('Missing template path.');
    }
    res.send(response);
    return false;
  }

  v.validate(jade, {filename: STATIC_DIR + path}, function(err, isValid){

    if(err){
      response.errors.push(err);
    }

    response.success = isValid;

    console.log( 'isValid JADE:', isValid );

    res.send(response);

  });

};