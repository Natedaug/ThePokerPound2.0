'use strict';

app.directive('emailBox', function() {
	return {
		restrict: 'E',
		templateUrl: 'views/emailBox.html',
		scope: {
      		show: '='
    	}, 
		link: function($scope, $element, $attrs, $parse) {
      		$scope.emails = [
			    { 
			        from: 'John',
			        to: 'me', 
			        subject: 'I love angular', 
			        date: 'Jan 1', 
			        body: 'hello world!"'
			    },
			    { 
			    	from: 'Jack',
			        to: 'me', 
			        subject: 'Angular and I are just friends', 
			        date: 'Feb 15', 
			        body: 'just kidding'
			    },
			    { 
			    	from: 'Ember',
			        to: 'me', 
			        subject: 'I hate you Angular!', 
			        date: 'Dec 8', 
			        body: 'wassup dude'
			    },
			    { 
			    	from: 'Ember',
			        to: 'me', 
			        subject: 'I hate you Angular!', 
			        date: 'Dec 8', 
			        body: 'wassup dude'
			    },
			    { 
			    	from: 'Ember',
			        to: 'me', 
			        subject: 'I hate you Angular!', 
			        date: 'Dec 8', 
			        body: 'wassup dude'
			    }

			];
    		//$scope.show=$attrs.show;
    		$scope.$watch('show', function(newValue, oldValue) {
    			if(newValue!==oldValue){
    				if(newValue){
    					$('.emailBox').slideDown();
    				}else{
    					$('.emailBox').slideUp();
    				}
    			}
    		});
			
			//if(!$attrs.show){$($element).slideToggle()};

	    	$scope.isPopupVisible = false;

	    	$scope.showPopup = function (email) {
	    		$scope.isPopupVisible = true;
	    		$scope.selectedEmail = email;
			};
			$scope.closePopup = function () {
	    		$scope.isPopupVisible = false;
			};

			$scope.isComposePopupVisible = false;

			$scope.showComposePopup = function () {
				$scope.composeEmail = {};
	    		$scope.isComposePopupVisible = true;
			};
			$scope.closeComposePopup = function () {
	    		$scope.isComposePopupVisible = false;
			};

			$scope.composeEmail = {};

			$scope.sendEmail = function() {
			    $scope.isComposePopupVisible = false;
			    $scope.composeEmail.from = "me";
			    $scope.composeEmail.date = new Date();
			    $scope.sentEmails.splice(0,0,$scope.composeEmail);
			};

			$scope.activeTab = "inbox";

			$scope.sentEmails = [];

			$scope.forward = function() {
				$scope.isPopupVisible = false;

				$scope.composeEmail = {};

				angular.copy($scope.selectedEmail, $scope.composeEmail);

				$scope.composeEmail.body = 
		        "\n-------------------------------\n" 
		        + "from: " + $scope.composeEmail.from + "\n"
		        + "sent: " + $scope.composeEmail.date + "\n"
		        + "to: " + $scope.composeEmail.to + "\n"
		        + "subject: " + $scope.composeEmail.subject + "\n"
		        + $scope.composeEmail.body;

		        $scope.composeEmail.subject = "FW: " + $scope.composeEmail.subject;

		        $scope.composeEmail.to = "";

		        $scope.composeEmail.from = "me";

				$scope.isComposePopupVisible = true;
			};

			$scope.reply = function() {
				$scope.isPopupVisible = false;

				$scope.composeEmail = {};

				angular.copy($scope.selectedEmail, $scope.composeEmail);

				$scope.composeEmail.body = 
		        "\n-------------------------------\n" 
		        + "from: " + $scope.composeEmail.from + "\n"
		        + "sent: " + $scope.composeEmail.date + "\n"
		        + "to: " + $scope.composeEmail.to + "\n"
		        + "subject: " + $scope.composeEmail.subject + "\n"
		        + $scope.composeEmail.body;

		        $scope.composeEmail.subject = "RE: " + $scope.composeEmail.subject;

		        $scope.composeEmail.to = $scope.composeEmail.from;

		        $scope.composeEmail.from = "me";

				$scope.isComposePopupVisible = true;
			};
    	}
	};
});