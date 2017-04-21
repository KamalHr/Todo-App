myApp.controller("todosCtrl",["$scope","$location","$timeout","$http","$state","$rootScope", function($scope,$location,$timeout,$http,$state,$rootScope){
	$rootScope.todos = [];
	$http.get("/todos")
	.then(function(success){
		$rootScope.todos = success.data;
	},function(error){
		console.log('Error');
		console.log(error);
	});

	$scope.delete = function(key){
		$http.delete("/todos/"+key)
		.then(function(success){
			$rootScope.todos = success.data;
			Materialize.toast("Item Deleted", 3000, 'rounded');
		}, function(err){
			swal("Error",err,error);
		});
	};
	$scope.done = function(todo){
		$http.put("/todos/"+todo._id,{name: todo.name, desc: todo.desc, done: !todo.done,owner: $rootScope.currentUser._id})
		.then(function(success){
			$rootScope.todos = success.data;
			if(!todo.done)
				Materialize.toast("Good Job!", 3000, 'rounded');
			else
				Materialize.toast("It's okay, try next time!", 3000, 'rounded');
		},function(err){
			swal("Error",err,error);
		});
	};
}]);

myApp.controller("addCtrl",["$scope","$location","$timeout","$http","$state","$rootScope", function($scope,$location,$timeout,$http,$state,$rootScope){
	$scope.todo = {
		name: "",
		desc: "",
		owner: $rootScope.currentUser._id,
		public: false,
		ownerName: $rootScope.currentUser.username
	};
	$scope.addItem = function(){
		$http.post('/todos',$scope.todo)
		.then(function(success){
			$state.go('todos');
		},function(err){
			swal('error',err,'error');
		});
	};
}]);

myApp.controller("editCtrl",["$scope","$location","$timeout","$http","$state","$stateParams","$rootScope", function($scope,$location,$timeout,$http,$state,$stateParams,$rootScope){
	$scope.todo = {
	};
	$http.get("/todos/"+$stateParams.id)
	.then(function(success){
		console.log(success.data);
		$scope.todo = success.data[0];
	},function(err){
		$state.go("add");
	});
	$scope.update = function(){
		if($rootScope.currentUser._id === $scope.todo.owner)
			$http.put("/todos/"+$stateParams.id,{name: $scope.todo.name, desc: $scope.todo.desc, done: $scope.todo.done, public: $scope.todo.public})
			.then(function(success){
				$state.go('todos');
				Materialize.toast("Successfully Updates!", 3000, 'rounded');
			},function(err){
				swal("Error",err,error);
			});
	};
}]);

myApp.controller("indexCtrl",["$scope","$location","$timeout","$http","$state","$rootScope", function($scope,$location,$timeout,$http,$state,$rootScope){
	$scope.doneAll = function(){
		$http.put("/todos",{done: true, owner: $rootScope.currentUser._id})
		.then(function(success){
			$rootScope.todos = success.data;
			$state.go("todos");
		},function(err){
			console.log(err);
		});
	};
}]);
myApp.controller("loginCtrl",["$scope","$location","$timeout","$http","$state","$rootScope", function($scope,$location,$timeout,$http,$state,$rootScope){
	$scope.user = {
		email: "",
		password: ""
	};
	$scope.login = function(){
		$http.post("/login",{username: $scope.user.email, password: $scope.user.password})
		.then(function(success){
			$rootScope.currentUser = success.data;
			console.log($rootScope.currentUser);
			$state.go('todos');
		},function(err){
			Materialize.toast("Wrong username or password!", 3000, 'rounded');
			console.log(err);
		});
	};
	$scope.signup = function(){
		$http.post("/signup",{username: $scope.user.email, password: $scope.user.password})
		.then(function(success){
			$rootScope.currentUser = success.data;
			$state.go('todos');
		},function(err){
			Materialize.toast("Something is wrong!", 3000, 'rounded');
			console.log(err);
		});
	};
}]);