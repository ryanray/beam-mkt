/**
 * This could be kind of scary, this allows a caller to flush the app's view cache. Helpful for when you update
 * a template but don't want to restart node. 
 *
 * NOTE: this doesn't work right now! Seems like jade and express have separate caches - so flushing the express cache
 * doesn't do anything since the jade one has the actual compiled template.
 */

//save reference to app so we can modify the cache -- eek -- need to investigate better way to do this.
var app;

var helpers = {
  flush: function(name, next){
    var result = false;
    if(!app){
      console.log('CacheManager not instantiated correctly. App not found.');
    }
    else if(app.cache && app.cache[name]){
      //result = delete app.cache[name];
      app.cache[name] = null;
      console.log('Individual cache flushed:' + name, result);
    }
    next(result);
  },
  flushAll: function(next){
    console.log('Entire cache flushed.');
    app.cache = null;
    next(true);
  },
  log: function(){
    console.log(app.cache);
  }
};

// you must initialize this in app.js
exports.init = function(_app){
  app = _app;
  console.log('CacheManager initialized.');
  return helpers;
};

exports.helpers = helpers;