var USER = process.env.BEAM_USR;
var PASS = process.env.BEAM_PWD;

var createFailedResponse = function(){
  return {isLoggedIn: false, errorMessage: 'Invalid username or password.'};
};

var createSuccessResponse = function(){
 return {isLoggedIn: true, firstName: "bob", lastName: "Johnson", username: "Yoda2323", id:1};
};

var validateLogin = function(username, password, next){

  if(!USER || !PASS){
    next(false);
    return false;
  }

  if( (username && username.length) && (password && password.length) && username === USER && password === PASS ){
    next(true);
    return true;
  }

  console.log('User: ' + username + ' failed to authenticate.');
  next(false);
  return false;

};

var getCredentialsFromHeader = function(req){

  var header=req.headers['authorization']||'',        // get the header
    token=header.split(/\s+/).pop()||'',            // and the encoded auth token
    auth=new Buffer(token, 'base64').toString(),    // convert from base64
    parts=auth.split(/:/),                          // split on colon
    username=parts[0],
    password=parts[1];

  console.log('HEADERS::', username, password);

  return {u: username, p: password};
};

exports.isAuthenticated = function(req, res, next){

  var credentials = getCredentialsFromHeader(req);

  var usr = credentials.u || req.body.username;
  var pwd = credentials.p || req.body.password;

  validateLogin(usr, pwd, function(response){
    next(null, response);
  });
};

exports.createFailedResponse = createFailedResponse;
exports.createSuccessResponse = createSuccessResponse;