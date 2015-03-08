'use strict';

app.controller('AngPokerController', 
	function($firebaseArray, $firebaseObject,$location,FIREBASE_URL,$scope,Auth,user,Table) {
      var ref = new Firebase(FIREBASE_URL+"/pokerrooms");
      var ref2 = new Firebase(FIREBASE_URL);
      $scope.rooms = $firebaseArray(ref);
 	  //this.user = Auth.user;

 	  if(!user){
  		$location.path('/register');
  	  } else {
  	  	$scope.user = user;
  	  	$scope.user.profile = $firebaseObject(ref2.child('profile').child(user.uid));
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

	  $scope.logout = Auth.logout; 
 	}
  );