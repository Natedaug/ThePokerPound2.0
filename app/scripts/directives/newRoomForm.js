'use strict';

app.directive('newRoomForm', function() {
	return {
		restrict: 'E',
		templateUrl: 'views/newRoomForm.html',
		scope: {
      		show: '=',     
          roomForm: '=bind'
    	}, 
		link: function($scope) {
      $scope.roomForm={
        maxPlayers: '10',
        blindLevel: '$10/$20',
        gameType: 'Cash',
        buyIn: '500'
      };
      
  		$scope.$watch('show', function(newValue, oldValue) {
  			if(newValue!==oldValue){
  				if(newValue){
  					$('.newRoomOptions').slideDown();
  				}else{
  					$('.newRoomOptions').slideUp();
  				}
  			}
  		});
    }
	};
});