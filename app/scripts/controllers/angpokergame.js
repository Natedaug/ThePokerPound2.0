'use strict';

app.controller('AngPokerController', 
	function($firebaseArray, $firebaseObject,$location,FIREBASE_URL,$scope,Auth,user,Table) {
      var ref = new Firebase(FIREBASE_URL+"/pokerrooms");
      var ref2 = new Firebase(FIREBASE_URL);
      $scope.rooms = $firebaseArray(ref);
      $scope.isEmailVisible = false;
      $scope.isLeaderBoardVisible = false;

 	  //this.user = Auth.user;

 	  if(!user){
  		$location.path('/');
  	  } else {
  	  	$scope.user = user;
  	  	$scope.user.profile = $firebaseObject(ref2.child('profile').child(user.uid));
  	  }
  	  
  	  //do email and leaderboar loading in this controller and pass the info to directives

  	  $scope.toggleEmailVisibility = function() {
  	  	$scope.isEmailVisible = !$scope.isEmailVisible;
  	  	if($scope.isLeaderBoardVisible){
  	  		$scope.isLeaderBoardVisible = !$scope.isLeaderBoardVisible;
  	  	}
  	  }
  	  $scope.toggleLeaderBoardVisibility = function() {
  	  	$scope.isLeaderBoardVisible = !$scope.isLeaderBoardVisible;
  	  	if($scope.isEmailVisible){
  	  		$scope.isEmailVisible = !$scope.isEmailVisible;
  	  	}
  	  }

	  $scope.newRoom = function() {
	    ref.push({
	      createdBy: $scope.user.profile.username,
	      roomname: $scope.roomName,
	      createddate: Date.now()
	    });
	    $scope.isNew = false;
	    $scope.rooms = $firebaseArray(ref);
	  };

	  $scope.deleteRoom = function(room) {
	    ref.child($scope.rooms[room].$id).remove(function(error) {
	      if (error) {
	        console.log("Error:", error);
	      } else {
	        console.log("Profile removed successfully!");
	      }
	    });
	  };
	 
	  $scope.joinRoom = function(room) {
	    $location.path('/pokerroom/' + $scope.rooms[room].$id);
	  };

	  $scope.signedIn = Auth.signedIn;
	  $scope.logout = Auth.logout; 
 	}
  );