app.controller("AuthCtrl", function($scope, Auth, $location) {
  // any time auth status updates, add the user data to scope
  	var user = Auth.resolveUser();
  	if(user){
  		$location.path('/AngPoker');
  	}

	$scope.login = function () {
	    Auth.login($scope.user).then(function () {
	      $location.path('/AngPoker');
	    }, function (error) {		
	      //$scope.error = error.toString() + "Creating User Now.....";
	      $scope.register($scope.user);
	    });
	};

	$scope.register = function () {	
		Auth.register($scope.user).then(function(user) {
			return Auth.login($scope.user).then(function(user) {
				user.username = $scope.user.username;
				user.avatar = $scope.user.avatar;
				return Auth.createProfile(user);
			}).then(function() {
				$location.path('/AngPoker');
			});
		}, function(error) {
			$scope.error = error.toString();
		});
	};

	$scope.signedIn = Auth.signedIn;
	$scope.logout = Auth.logout;

});