'use strict';

app.controller('ChatController', ['$scope', '$firebaseArray',
    function($scope, $firebaseArray) {
      var ref = new Firebase("https://pokerpound.firebaseio.com/messages");
      $scope.messages = $firebaseArray(ref);

      //ADD MESSAGE METHOD
      $scope.addMessage = function(e) {

        //LISTEN FOR RETURN KEY
        if (e.keyCode === 13 && $scope.msg) {
          //ALLOW CUSTOM OR ANONYMOUS USER NAMES
          var name = $scope.name || 'anonymous';
          $scope.messages.$add({from: name, body: $scope.msg});
          //RESET MESSAGE
          $scope.msg = "";
        }
      }

    }
  ]);