var fs = require('fs');
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Beam Lending'});
};

exports.staticRoute = function(req, res){
  var path = req.path;
  var viewPath = process.cwd() + '/views/static' + path + '.jade';

console.log('VIEW PATH', viewPath);

  fs.exists(viewPath, function(exists){
    if(exists){
      res.render(viewPath, { 
        title: 'Beam Lending'
        // company: company,
        // pageType: 'proposal' 
      });
    }
    else {
      //TODO 404 response
      res.send('Page not found.');
    }
  });
};