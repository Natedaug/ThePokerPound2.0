'use strict';

app.directive('leaderBoard', function($firebaseArray, FIREBASE_URL) {
	return {
		restrict: 'E',
		templateUrl: 'views/leaderBoard.html',
		scope: {
      		show: '=',
          userRank: '=bind',
          username: '='
    	}, 
		link: function($scope) {
      
			var ref = new Firebase(FIREBASE_URL+'/profile/');
			$scope.leaderList = $firebaseArray(ref.orderByChild('balance'));
            
      $scope.leaderList.$loaded()
        .then(function() {
          $scope.leaderList = $scope.leaderList.slice().reverse();
          for( var i = 0; i < $scope.leaderList.length; i++){
            if($scope.leaderList[i].username === $scope.username){
                $scope.userRank = i +1;
            }
          }
        })
        .catch(function(error) {
          console.log('Error:', error);
        });
      

  		$scope.$watch('show', function(newValue, oldValue) {
  			if(newValue!==oldValue){
  				if(newValue){
  					$('.leaderBoard').slideDown();
  				}else{
  					$('.leaderBoard').slideUp();
  				}
  			}
  		});
    }
	};
});