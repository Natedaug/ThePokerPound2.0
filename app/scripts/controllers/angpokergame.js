'use strict';

app.controller('AngPokerController', 
	function($firebaseArray, $firebaseObject,$location,FIREBASE_URL,$scope,Auth,user) {
      var ref = new Firebase(FIREBASE_URL+'/pokerrooms');
      var ref2 = new Firebase(FIREBASE_URL);
      $scope.rooms = $firebaseArray(ref);
      $scope.isEmailVisible = false;
      $scope.isLeaderBoardVisible = false;
      $scope.isNew = false;

 	  if(!user){
  		$location.path('/');
  	  } else {
  	  	$scope.user = user;
  	  	$scope.user.profile = $firebaseObject(ref2.child('profile').child(user.uid));
  	  }
  	  

  	  $scope.toggleEmailVisibility = function() {
  	  	$scope.isEmailVisible = !$scope.isEmailVisible;
  	  	if($scope.isLeaderBoardVisible){
  	  		$scope.isLeaderBoardVisible = !$scope.isLeaderBoardVisible;
  	  	}
  	  };
  	  $scope.toggleLeaderBoardVisibility = function() {
  	  	$scope.isLeaderBoardVisible = !$scope.isLeaderBoardVisible;
  	  	if($scope.isEmailVisible){
  	  		$scope.isEmailVisible = !$scope.isEmailVisible;
  	  	}
  	  };

  	  $scope.refillBalance = function() {
  	  	if($scope.user.profile.balance < 1000){
  	  		$scope.user.profile.balance = 1000;
  	  		$scope.user.profile.$save();
  	  	}
  	  };

  	  $scope.isEditProfileVisible = false;

	  $scope.showEditProfile = function () {
	    $scope.isEditProfileVisible = true;
	  };

	  $scope.closeEditProfile = function () {
	    $scope.isEditProfileVisible = false;
	    $scope.user.profile.$save();
	  };

	  $scope.newRoom = function() {
	    if($scope.roomForm.gameType === 'Cash'){
	    	ref.push({
 		  	  blindLevel: $scope.roomForm.blindLevel,
 		  	  createdBy: $scope.user.profile.username,
		      roomname: $scope.roomName,
		      maxPlayers: $scope.roomForm.maxPlayers,
		      gameType: $scope.roomForm.gameType,
		      players: 0,
		      createddate: Date.now()
 		  	});
	    } else if($scope.roomForm.gameType === 'Sit-n-Go'){
	    	ref.push({
 		  	  buyIn: $scope.roomForm.buyIn,
 		  	  createdBy: $scope.user.profile.username,
		      roomname: $scope.roomName,
		      maxPlayers: $scope.roomForm.maxPlayers,
		      gameType: $scope.roomForm.gameType,
		      players: 0,
		      createddate: Date.now()
 		  	});
	    }
	    $scope.isNew = false;
	    $scope.rooms = $firebaseArray(ref);
	  };

	  $scope.deleteRoom = function(room) {
	    ref.child($scope.rooms[room].$id).remove(function(error) {
	      if (error) {
	        console.log('Error:', error);
	      } else {
	        console.log('Room removed successfully!');
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