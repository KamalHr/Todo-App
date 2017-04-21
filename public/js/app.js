var myApp = angular.module("myApp",["ui.router"]);
myApp.factory('AuthService', function ($http, $state,$q,$rootScope) {
  	var isLogged = function () {
  		var deferred = $q.defer();
  		$http.get("http://localhost:3000/loggedin")
		.then(function(success){
			$rootScope.currentUser = success.data;
			return deferred.resolve();
		},function(err){
			$state.go('login');
			return deferred.reject();
		}).catch(function() {
			$scope.error = 'unable to get the ponies';
  		});
		return deferred.promise;
  	};
  	return {
  		isLogged: isLogged
  	};
});
myApp.config(['$stateProvider','$urlRouterProvider','$locationProvider',"$httpProvider" ,function($stateProvider,$urlRouterProvider,$locationProvider) {
	$stateProvider.state('index',{
		views: {
			"index": {
				templateUrl: "templates/index.html",
				controller: "indexCtrl"
			}
		}
	});
	$stateProvider.state('todos',{
		parent: 'index',
		url: '/',
		views: {
			"main": {
				templateUrl: "templates/parties/todos.html",
				controller: "todosCtrl"
			}
		}
	});
	$stateProvider.state('add',{
		parent: 'index',
		url: '/add',
		views: {
			"main": {
				templateUrl: "templates/parties/add.html",
				controller: "addCtrl"
			}
		},
		resolve: {
  			data: ["AuthService", function (AuthService) {
    			return AuthService.isLogged();
  			}]
		}
	});
	$stateProvider.state('login',{
		parent: 'index',
		url: '/login',
		views: {
			"main": {
				templateUrl: "templates/parties/login.html",
				controller: "loginCtrl"
			}
		}
	});
	$stateProvider.state('edit',{
		parent: 'index',
		url: '/edit/:id',
		views: {
			"main": {
				templateUrl: "templates/parties/edit.html",
				controller: "editCtrl",
				params: ['id'] 
			}
		},
		resolve: {
  			data: ["AuthService", function (AuthService) {
    			return AuthService.isLogged();
  			}]
		}
	});
	$urlRouterProvider.otherwise('/');
}]);
myApp.run(function($rootScope, $http,$state,$rootScope){
    $rootScope.logout = function(){
      	$http.post('/logout')
      	.then(function(success){
      		$rootScope.currentUser = null;
      		$state.go("login");
      		Materialize.toast("Successfully logged out!", 3000, 'rounded');
      	});
    };
    $http.get("/loggedin").then(function(success){
    	$rootScope.currentUser = success.data;
    },function(error){
    	$rootScope.currentUser = null;
    })
});
