var _jade = require('jade');

var validate = function(html, opts){
  console.log(html);
  var compiled = _jade.compile(html, opts);
  return (typeof compiled === 'function');
};

exports.validate = function(jadeTemplate, options, next){
  try {
    next(null, validate(jadeTemplate, options));
  }
  catch(e){
    console.log('Couldnt parse template:\n', e);
    next(e, false);
  }
};