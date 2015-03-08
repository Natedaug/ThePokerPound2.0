'use strict'

app.controller("NavAuthCtrl", function($scope, Auth, $location, $firebaseObject, FIREBASE_URL) {
  // any time auth status updates, add the user data to scope

$scope.login = function () {
    Auth.login($scope.user).then(function () {
      $scope.email = Auth.resolveUser().password.email;
      $location.path('/AngPoker');
    }, function (error) {
      $scope.error = error.toString();
    });
};

$scope.register = function () {	
	Auth.register($scope.user).then(function() {
		return Auth.login($scope.user).then(function() {
			$location.path('/AngPoker');
			console.log($scope.authData);
		});
	}, function(error) {
		$scope.error = error.toString();
		console.log($scope.error);
	});
};

$scope.signedIn = Auth.signedIn;
$scope.logout = Auth.logout;
if($scope.signedIn()){
  $scope.email = Auth.resolveUser().password.email;
}

$scope.user = Auth.resolveUser();
if(!$scope.user.profile){
	var ref = new Firebase(FIREBASE_URL);
	$scope.user.profile = $firebaseObject(ref.child('profile').child($scope.user.uid));
}

$scope.usercheck = Auth.checkUser();
$scope.usercheck.$onAuth(function(authData){
  $scope.user = Auth.resolveUser();
})

});