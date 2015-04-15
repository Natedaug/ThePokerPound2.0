'use strict';

app.directive('leaderBoard', function($firebaseArray, FIREBASE_URL) {
	return {
		restrict: 'E',
		templateUrl: 'views/leaderBoard.html',
		scope: {
      		show: '='
    	}, 
		link: function($scope, $element, $attrs, $parse) {
			var ref = new Firebase(FIREBASE_URL+'/profile/');
			$scope.userList = $firebaseArray(ref);

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