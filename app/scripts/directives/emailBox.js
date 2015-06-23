'use strict';

app.directive('emailBox', function($firebaseArray, $firebaseObject, FIREBASE_URL) {
	return {
		restrict: 'E',
		templateUrl: 'views/emailBox.html',
		scope: {
      		show: '=',
      		user: '=',
      		unread: '=bind'
    	}, 
		link: function($scope) {
			$scope.unread = 0;
    		var uid = $scope.user.uid;

			var ref = new Firebase(FIREBASE_URL); //list of current p-mails
			$scope.emails = $firebaseArray(ref.child('profile').child($scope.user.uid).child('messages'));
			$scope.sentEmails = $firebaseArray(ref.child('profile').child($scope.user.uid).child('sentEmails'));

			$scope.userList = $firebaseObject(ref.child('profile').orderByChild('username')); //get userlist for out going here in js
			$scope.people = $firebaseArray(ref.child('profile').orderByChild('username')); //array for autocomplete in html
			
			$scope.emails.$loaded().then(function () {
				console.log($scope.emails);
				for( var i = 0; i < $scope.emails.length; i++){  
			    	if( $scope.emails[i].read === false){
			    		$scope.unread++;     //counts unread emails
			    	}
			    	if( $scope.emails[i].confirm ){
			    		$scope.emails[i].confirm = false;  //reset confirm wich is used for deleting
			    	}
			    }
			    $scope.$watch('emails.length', function(newValue, oldValue) { //update unread on incoming massages
    			if(newValue!==oldValue){
    				if(newValue>oldValue){
    					$scope.unread++;
    				}
    			}
    		});
			});
			
    		$scope.$watch('show', function(newValue, oldValue) { //toggle showing directive
    			if(newValue!==oldValue){
    				if(newValue){
    					$('.emailBox').slideDown();
    				}else{
    					$('.emailBox').slideUp();
    				}
    			}
    		});

    		$scope.$watch('selectedPerson.originalObject', function(newValue, oldValue) {
    			if(newValue!==oldValue){
    				if(newValue){
    					$scope.composeEmail.to = $scope.selectedPerson.originalObject;
    				}
    			}
    			
    		});	

	    	$scope.isPopupVisible = false;

	    	$scope.showPopup = function (email) {
	    		$scope.isPopupVisible = true;
	    		if(!email.read){
	    			email.read = true;
	    			$scope.unread--;
	    		}
	    		$scope.emails.$save(email).then(function(){
	    			email.confirm = false; //reset confirm wich is used for deleting emails
	    		}, function(error) {
	    			console.log('Error:', error);
	    		});
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

			    $scope.composeEmail.from = $scope.userList[uid].username;
			    $scope.composeEmail.date = new Date();
			    var recipiantUid=-1;
			    for( var k in $scope.userList){  //find recipiants user ID
			    	if( $scope.userList[k]){
			    		if($scope.userList[k].username === $scope.composeEmail.to){
			    			recipiantUid = k;
			    		}
			    	}
			    }
			    var msg = { 
			    	from: $scope.composeEmail.from,
			        to: $scope.composeEmail.to, 
			        subject: $scope.composeEmail.subject, 
			        date: $scope.composeEmail.date.toDateString(), 
			        body: $scope.composeEmail.body,
			        read: false
			    };
			    $scope.emailRecipiant = $firebaseArray(ref.child('profile').child(recipiantUid).child('messages'));
			    
			    $scope.emailRecipiant.$add(msg);
			    msg.read=true;                 //makes sure all sent messages are marked as read
			    $scope.sentEmails.$add(msg);
				
			};

			$scope.deleteEmail = function(email){ //added new property to make user double click to delete
				if(email.confirm){
					$scope.emails.$remove(email).then(function() {
	
					});
				}else{
					email.confirm = true;
				}
			};
			$scope.deleteSentEmail = function(email){ //added new property to make user double click to delete
				if(email.confirm){
					$scope.sentEmails.$remove(email).then(function() {
	
					});
				}else{
					email.confirm = true;
				}
			};
			$scope.activeTab = 'inbox';

			
			$scope.forward = function() {
				$scope.isPopupVisible = false;

				$scope.composeEmail = {};

				angular.copy($scope.selectedEmail, $scope.composeEmail);

				$scope.composeEmail.body = 
		        '\n-------------------------------\n' + 
		        'from: ' + $scope.composeEmail.from + '\n' + 
		        'sent: ' + $scope.composeEmail.date + '\n' +
		        'to: ' + $scope.composeEmail.to + '\n' + 
		        'subject: ' + $scope.composeEmail.subject + '\n' + 
		        $scope.composeEmail.body;

		        $scope.composeEmail.subject = 'FW: ' + $scope.composeEmail.subject;

		        $scope.composeEmail.to = '';

		        $scope.composeEmail.from = 'me';

				$scope.isComposePopupVisible = true;
			};

			$scope.reply = function() {
				$scope.isPopupVisible = false;

				$scope.composeEmail = {};

				angular.copy($scope.selectedEmail, $scope.composeEmail);

				$scope.composeEmail.body = 
		        '\n-------------------------------\n' + 
		        'from: ' + $scope.composeEmail.from + '\n' + 
		        'sent: ' + $scope.composeEmail.date + '\n' + 
		        'to: ' + $scope.composeEmail.to + '\n' + 
		        'subject: ' + $scope.composeEmail.subject + '\n' + 
		        $scope.composeEmail.body;

		        $scope.composeEmail.subject = 'RE: ' + $scope.composeEmail.subject;

		        $scope.composeEmail.to = $scope.composeEmail.from;
		        console.log($scope.composeEmail.to);
		        $scope.composeEmail.from = 'me';

				$scope.isComposePopupVisible = true;
			};
    	}
	};
});