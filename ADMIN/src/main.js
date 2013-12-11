var app = angular.module('admin', [], function($routeProvider, $locationProvider, breadcrumbs){
  $locationProvider.html5Mode(true);
  $routeProvider
    .when('/admin/login', {
      templateUrl: '/admin/tmpl?name=login',
      controller: 'LoginCtrl',
      label: 'Admin Login'
    })
    // .when('/admin/user/:userId', {
    //   templateUrl: '/admin/tmpl?name=user',
    //   controller: 'UserCtrl'
    // })
    .when('/admin/staticPages', {
      templateUrl: '/admin/tmpl?name=staticPageList',
      controller: 'StaticPageListCtrl',
      label: 'Admin'
    })
    .when('/admin/staticPages/:id', {
      templateUrl: '/admin/tmpl?name=staticPageEdit',
      controller: 'SingleStaticPageCtrl',
      label: 'Edit'
    })
    .when('/admin/createPage', {
      templateUrl: '/admin/tmpl?name=staticPageEdit',
      controller: 'CreatePageCtrl',
      label: 'Create'
    })
    //TODO: could implement a 404 page
    .otherwise({
      redirectTo: '/admin/staticPages'
    });
});

/**
 * AuthService provides a way to interact with Server Side Authentication.
 * BasicAuth was used instead of something session based to stay inline with REST principles.
 */
app.factory('AuthService', function($http, $location, AuthorizedUser, UserData, ConfigService){
  return {
    login: function(username, password, next, onError){
      //configure headers for BasicAuth
      $http.defaults.headers.common.Authorization = 'Basic ' + btoa(username + ':' + password);

      AuthorizedUser.loadByUsername(username, password, next, onError);

    },
    logout: function(){
      AuthorizedUser.clearAll();
      UserData.clearAll();
      $location.path(ConfigService.urls.login);
    }
  };
});

//May be better as a provider
app.factory('ConfigService', function(){
  return {
    urls: {
      login: '/admin/login', 
      user: '/admin/user',
      staticPages: '/admin/staticPages',
      staticPagesNew: '/admin/createPage',
      validation: {
        jade: '/admin/validate/jade'
      }
    }
  };
});

/**
 * MainController is a basic wrapper to handle any Header or "Global" interactions.
 */
function MainCtrl($scope, $location, AuthorizedUser, AuthService, ConfigService){
  $scope.AuthorizedUser = AuthorizedUser;
  $scope.logout = AuthService.logout;
  $scope.redirectToLogin = function(){
    $location.path(ConfigService.urls.login);
  };
}


/**
 * LoginController to handle login form
 */
function LoginCtrl($scope, $location, AuthorizedUser, AuthService, ConfigService, GlobalMessageService){

  $scope.handleLogin = function(){

    AuthService.login($scope.LoginModel.username, $scope.LoginModel.password, function(data){
      if(AuthorizedUser.isLoggedIn){
        //clear login form after login success
        $scope.LoginModel.username = '';
        $scope.LoginModel.password = '';
        //$location.path(ConfigService.urls.user + '/' + AuthorizedUser.userId);
        $location.path(ConfigService.urls.staticPages);
      }
      else {
        // show error message
        // $scope.errorMessage = data.errorMessage;
        GlobalMessageService.setErrorMessages([data.errorMessage]);
      }
    }, function(){
      //on $http error show message
      //$scope.errorMessage = 'There was a problem with your request';
      GlobalMessageService.setErrorMessages(['There was a problem with your request']);
    });
  };
};

function StaticPageListCtrl($scope, $http, $location, AuthorizedUser, StaticPageData, ConfigService, GlobalMessageService){
  $scope.StaticPageData = StaticPageData;

  // Redirect to login page if user is not authorized - this could probably be done better
  // in some sort of middleware.
  if(!AuthorizedUser.isLoggedIn){
    $location.path(ConfigService.urls.login);
    return false;
  }

  var renderStaticPageList = function(){
    StaticPageData.loadAll(function(data){
      if(data.errorMessage){
        $scope.errorMessage = data.errorMessage;
      }
    }, function(){
      // handle $http error
      $scope.errorMessage = 'Problem getting static page data.';
    });
  };
  renderStaticPageList();

  $scope.handleStaticPageDelete = function(){
    //TODO: this should be moved to the "model"
    if(window.confirm('Are you sure you want to delete ' + this.file + '?')){
      var _this = this;
      $http.delete(ConfigService.urls.staticPages, {params: {templateName: this.file}})
        .success(function(result){
          if(result.success === true && !result.errors.length){
            //$location.path(ConfigService.urls.staticPages);
            renderStaticPageList();
            GlobalMessageService.setSuccessMessage(_this.file + ' has been deleted.');
          }
          else {
            GlobalMessageService.setErrorMessages(result.errors);
          }
        })
        .error(function(){
          GlobalMessageService.setErrorMessages(['Your file wasn\'t deleted because there was a problem with your request']);
        });
    }
  };

  $scope.handleStaticPageNew = function(){
    $location.path(ConfigService.urls.staticPagesNew);
  };

  $scope.handleStaticPageEdit = function(){
    $location.path(ConfigService.urls.staticPages + this.file);
  };
};

function SingleStaticPageCtrl($scope, $location, AuthorizedUser, SingleStaticPage, ConfigService, $routeParams, GlobalMessageService){
  $scope.SingleStaticPage = SingleStaticPage;
  // Redirect to login page if user is not authorized - this could probably be done better
  // in some sort of middleware.
  if(!AuthorizedUser.isLoggedIn){
    $location.path(ConfigService.urls.login);
    return false;
  }

  SingleStaticPage.loadByName($routeParams.id, function(data){
    if(data.errorMessage){
      $scope.errorMessage = data.errorMessage;
    }
  }, function(){
    // handle $http error
    $scope.errorMessage = 'Problem getting static page data.';
  });

  $scope.handleSubmit = function(){
    SingleStaticPage.validate(function(validationResponse){
      if(validationResponse.isValid === true){
        SingleStaticPage.save(function(saveResponse){
          // on success 
          if(!saveResponse.errors.length){
            $location.path(ConfigService.urls.staticPages);
            GlobalMessageService.setSuccessMessage('Your changes have been saved.');
          }
          else {
            GlobalMessageService.setErrorMessages(saveResponse.errors);
          }
        },
        function(){
          // on error
          console.log('ERROR!', arguments);
          GlobalMessageService.setErrorMessages(['There was a problem with your request']);
        });
      }
      else {
        console.log('INVALID!!');
        GlobalMessageService.setErrorMessages(validationResponse.errors);
      }
    });
  };
};

function CreatePageCtrl($scope, AuthorizedUser, ConfigService, SingleStaticPage, $location, GlobalMessageService){
  $scope.SingleStaticPage = SingleStaticPage;

  // Redirect to login page if user is not authorized - this could probably be done better
  // in some sort of middleware.
  if(!AuthorizedUser.isLoggedIn){
    $location.path(ConfigService.urls.login);
    return false;
  }

  SingleStaticPage.newPage();

  $scope.handleSubmit = function(){
    SingleStaticPage.validate(function(validationResponse){
      if(validationResponse.isValid === true){
        SingleStaticPage.create(function(createResponse){
          // on success 
          if(!createResponse.errors.length){
            $location.path(ConfigService.urls.staticPages);
            GlobalMessageService.setSuccessMessage('Your page has been created.');
          }
          else {
            GlobalMessageService.setErrorMessages(createResponse.errors);
          }
        },
        function(){
          // on error
          console.log('ERROR!', arguments);
          GlobalMessageService.setErrorMessages(['There was a problem with your request']);
        });
      }
    else {
      console.log('INVALID!!');
      GlobalMessageService.setErrorMessages(validationResponse.errors);
    }
    });
  };

};


function GlobalMsgCtrl($scope, GlobalMessageService){
  $scope.GlobalMessageService = GlobalMessageService
}

function BreadcrumbCtrl($scope, breadcrumbs){
  $scope.breadcrumbs = breadcrumbs;
}

/**
 * AuthorizedUser represents the state of the current user and whether or not they
 * have been Authenticated.
 */
app.factory('AuthorizedUser', function($http, ConfigService){
  return {
    isLoggedIn: false,
    username: null,
    password: null,
    userId: null,
    update: function(data){
      this.isLoggedIn = data.isLoggedIn;
      this.username = data.username;
      this.userId = data.id;
    }, 
    clearAll: function(){
      this.isLoggedIn = false;
      this.username = null;
      this.userId = null;
    },
    loadByUsername: function(username, password, next, onError){
      var _this = this;
      $http.post(ConfigService.urls.login, {username: username, password: password})
        .success(function(data, status, headers, config){
          _this.update(data);
          next(data);
        }).error(function(){
          onError(); //TODO: pass on error details
        });
    }
  };
});

//MAIN STATIC PAGE LIST
app.factory('SingleStaticPage', function($http, ConfigService, AuthorizedUser, GlobalMessageService, ConfigService){
  return {
    jade: null,
    template: null,
    update: function(data){
      // this.files = data.files;
      this.jade = data.jade;
      this.template = data.templateName;
    },
    validate: function(next){
      var isValid = false;
      var result = {isValid: false, errors: []};
      if(!this.validateName(this.template)){
        result.errors.push('Template Name is invalid. Must begin with a forward slash and not use any special characeters.');
        next(result);
        return false;
      }
      //more validation here

      //validate jade is an AJAX call
      this.validateJade(this.template, this.jade, 
        //is valid
        function(response){
          result.isValid = response.success && !response.errors.length;
          result.errors = response.errors;
          console.log('RESPONSE', response);
          next(result);
        },
        // ajax error
        function(){
          console.log('ERROR RESPONSE', response);
          next('There was a problem validating your template. Please try again later.');
        });

      //return {isValid: errors.length === 0, errors: errors};
    },
    validateName: function(name){
      var slashes = (name) ? name.match(/\//ig) : null;
      return (name && name[0] === '/' && slashes.length === 1);
    },
    validateJade: function(fileName, jade, next, onError){
      if(!fileName){
        next('fileName required.', false);
        return false;
      }
      if(!jade){
        //no jade === valid
        next(null, true);
        return true;
      }
      $http.post(ConfigService.urls.validation.jade, {jade: jade, path: fileName})
        .success(next)
        .error(onError);
    },
    newPage: function(){
      this.update({jade:null, template: null});
    },
    loadByName: function(staticPageName, next, onError){
      var _this = this;
      staticPageName = (staticPageName && staticPageName[0] !== '/') ? '/' + staticPageName : staticPageName;

      $http.get(ConfigService.urls.staticPages + '?templateName=' + staticPageName)
        .success(function(data, status, headers, config){
          // _this.update(data);
          data.templateName = staticPageName;
          _this.update(data);
          next(data);
        }).error(function(){
          onError(); //TODO: pass in error data
        });
    },
    save: function(next, onError){
      var _this= this;
      var _data = {templateName: this.template, jade: this.jade};
      $http.put(ConfigService.urls.staticPages, _data)
        .success(function(d){
          // _this.update(_data);
          //GlobalMessageService.setSuccessMessage('Your changes have been saved.');
          next(d);
        })
        .error(function(d){
          console.log('Problem updating SingleStaticPage');
          onError(d);
        });
    },
    create: function(next, onError){
      var _this= this;
      var _data = {templateName: this.template, jade: this.jade};
      $http.post(ConfigService.urls.staticPages, _data)
        .success(function(d){
          // _this.update(_data);
          //GlobalMessageService.setSuccessMessage('Your changes have been saved.');
          next(d);
        })
        .error(function(d){
          console.log('Problem creating SingleStaticPage');
          onError(d);
        }); 
    }
  }
});

//MAIN STATIC PAGE LIST
app.factory('StaticPageData', function($http, ConfigService, AuthorizedUser){
  return {
    files: [],
    update: function(data){
      this.files = data.files;
    },
    loadAll: function(next, onError){
      var _this = this;
      $http.get(ConfigService.urls.staticPages)
        .success(function(data, status, headers, config){
          _this.update(data);
          //GlobalMessageService.globalSuccessMessage = 'Your changes have been saved.';
          next(data);
        }).error(function(){
          //GlobalMessageService.setErrorMessage('There was a problem saving your changes.');
          onError(); //TODO: pass in error data
        });
    }
  }
});

//Messaging at top of page
app.factory('GlobalMessageService', function(){
  
  var DEFAULT_DURATION = 3000;

  return {
    globalSuccessMessage: '',
    globalErrorMessage: [],
    setSuccessMessage: function(msg, duration){
      var _this = this;
      this.globalSuccessMessage = msg;
      window.setTimeout(function(){
        _this.globalSuccessMessage = '';
      }, duration || DEFAULT_DURATION);
    },
    setErrorMessages: function(msgArr, duration){
      var _this = this;
      console.log('IS ARRAY!', Array.isArray(msgArr));
      this.globalErrorMessage = Array.isArray(msgArr) ? msgArr : [msgArr];
      window.setTimeout(function(){
        _this.globalErrorMessage = [];
      }, duration || DEFAULT_DURATION);
    }
  }
});

// angular.module('customControl', []).
//   directive('contenteditable', function() {
//     return {
//       restrict: 'A', // only activate on element attribute
//       require: '?ngModel', // get a hold of NgModelController
//       link: function(scope, element, attrs, ngModel) {
//         if(!ngModel) return; // do nothing if no ng-model
 
//         // Specify how UI should be updated
//         ngModel.$render = function() {
//           element.html(ngModel.$viewValue || '');
//         };
 
//         // Listen for change events to enable binding
//         element.on('blur keyup change', function() {
//           scope.$apply(read);
//         });
//         read(); // initialize
 
//         // Write data to the model
//         function read() {
//           var html = element.html();
//           // When we clear the content editable the browser leaves a <br> behind
//           // If strip-br attribute is provided then we strip this out
//           if( attrs.stripBr && html == '<br>' ) {
//             html = '';
//           }
//           ngModel.$setViewValue(html);
//         }
//       }
//     };
//   });

/**
 * UserData holds all the data necessary for the User Panel display. As of now this 
 * user is the same as AuthorizedUser but by keeping this object separate it will
 * make it easier to allow users to view the profile of someone else in the future.
 */
// Super ugly pattern - I look forward to learning a better/cleaner way to do this.
app.factory('UserData', function($http, ConfigService, AuthorizedUser){
  return {
    username: null,
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    userId: null,
    update: function(data){
      this.username = data.username;
      this.firstName = data.firstName;
      this.lastName = data.lastName;
      this.email = data.email;
      this.phone = data.phone;
      this.userId = data.id;
    },
    clearAll: function(){
      this.username = null;
      this.firstName = null;
      this.lastName = null;
      this.email = null;
      this.phone = null;
      this.userId = null;
      this.password = null;
    }, 
    loadById: function(id, next, onError){
      var _this = this;
      $http.get(ConfigService.urls.user + '/' + id)
        .success(function(data, status, headers, config){
          _this.update(data);
          next(data);
        }).error(function(){
          onError(); //TODO: pass in error data
        });
    },
    save: function(next, onError){
      $http.put(ConfigService.urls.user + '/' + this.userId, this)
        .success(next).error(onError);
    }
  };
});


/**
 * angular-breadcrumb.js - A better AngularJS service to help with breadcrumb-style navigation between views.
 * Based on breadcrumb.js (https://github.com/angular-app/angular-app/blob/master/client/src/common/services/breadcrumbs.js)
 *
 * @author Ian Kennington Walter (http://www.iankwalter.com)
 */
app.factory('breadcrumbs', ['$rootScope', '$location', '$route', function($rootScope, $location, $route) {

    var breadcrumbs = [],
        breadcrumbsService = {},
        routes = $route.routes;

    var generateBreadcrumbs = function() {
        breadcrumbs = [];
        var pathElements = $location.path().split('/'),
            path = '';

        var getRoute = function(route) {
            angular.forEach($route.current.params, function(value, key) {
                var re = new RegExp(value);
                route = route.replace(re, ':' + key);
            });
            return route;
        };
        if (pathElements[1] == '') delete pathElements[1];
        angular.forEach(pathElements, function(el) {
            path += path === '/' ? el : '/' + el;
            var route = getRoute(path);
            if (routes[route] && routes[route].label) {
                breadcrumbs.push({ label: routes[route].label, path: path });
            }
        });
    };

    // We want to update breadcrumbs only when a route is actually changed
    // as $location.path() will get updated immediately (even if route change fails!)
    $rootScope.$on('$routeChangeSuccess', function(event, current) {
        generateBreadcrumbs();
    });

    breadcrumbsService.getAll = function() {
        return breadcrumbs;
    };

    breadcrumbsService.getFirst = function() {
        return breadcrumbs[0] || {};
    };

    return breadcrumbsService;
}]);

/**
 * UserController is used to display the User Panel.
 */
// function UserCtrl($scope, $http, AuthorizedUser, UserData, $location, ConfigService){
//   $scope.UserData = UserData;

//   // Redirect to login page if user is not authorized - this could probably be done better
//   // in some sort of middleware.
//   if(!AuthorizedUser.isLoggedIn || $location.path().indexOf(AuthorizedUser.userId) < 0){
//     $location.path(ConfigService.urls.login);
//     return false;
//   }

//   // Load the User's data to show in User Panel
//   // Loading by AuthorizedUser's ID ensures that you can only see your own profile.
//   UserData.loadById(AuthorizedUser.userId, function(data){
//     if(data.errorMessage){
//       $scope.errorMessage = data.errorMessage;
//     }
//   }, function(){
//     // handle $http error
//     $scope.errorMessage = 'Problem getting user data.';
//   });

//   // Save User form to db
//   $scope.handleSaveUser = function(data){
//     UserData.save(function(data){
//       if(data.success){
//         $scope.saveSuccessful = data.success;
//         //clear existing error message if necessary
//         $scope.errorMessage = null;
//       }
//       else if(data.errorMessage){
//         $scope.errorMessage = data.errorMessage;
//         $scope.saveSuccessful = null;
//       }
//     }, function(){
//       // handle $http error
//       $scope.errorMessage = 'There was a problem while trying to save your data.';
//     });
//   };
// }

