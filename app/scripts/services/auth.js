'use strict';

app.factory("Auth", function($firebaseObject, $firebaseAuth,FIREBASE_URL, $rootScope) {
  var ref = new Firebase(FIREBASE_URL);
  var auth = $firebaseAuth(ref);

  var Auth = {
      register: function (user) {
        user.email = user.username + "@" + user.username+".com";
        return auth.$createUser({
        	email : user.email, 
        	password : user.password
        });
      },
      createProfile: function (user){
        var profile = {
          username: user.username,
          avatar: user.avatar,
          balance: 1000,
          sitting: false,
          seat: -1
        }

        var profileRef = new Firebase(FIREBASE_URL+"/profile/"+user.uid);
        return profileRef.set(profile);
      },
      signedIn: function () {
        if(auth.$getAuth()){
          return true;
        }
        else {
          return false;
        }
      },
      login: function (user) {
        user.email = user.username + "@" + user.username+".com";
        return auth.$authWithPassword({
        	email : user.email, 
        	password : user.password,
        }, function(error, authData){
            remember: "sessionOnly"
          }).then(function(authData){
            $rootScope.$broadcast('$firebaseAuth:authWithPassword',authData);
            return authData;
        });
      },
      logout: function () {
        auth.$unauth();
        $rootScope.$broadcast('$firebaseAuth:unauth');
      },
      resolveUser: function () {
      	return auth.$getAuth();    //get current User
      },
      checkUser: function () {
        return auth;    //get current User
      },
      user:{}
    };

    $rootScope.$on('$firebaseAuth:authWithPassword', function(e, user) {
	    angular.copy(user, Auth.user);
      Auth.user.profile = $firebaseObject(ref.child('profile').child(Auth.user.uid));
	  });
	  $rootScope.$on('$firebaseAuth:unauth', function() {
	    console.log('logged out');
      if(Auth.user && Auth.user.profile) {
        Auth.user.profile.$destroy();
      }
	    angular.copy({}, Auth.user);
	  });

    return Auth;
});