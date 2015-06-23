'use strict';

app.factory('Auth', function($firebaseObject, $firebaseArray, $firebaseAuth,FIREBASE_URL, $rootScope, $location) {
  var ref = new Firebase(FIREBASE_URL);
  var auth = $firebaseAuth(ref);

  var Auth = {
      register: function (user) {
        user.email = user.username + '@' + user.username+'.com';
        return auth.$createUser({
        	email : user.email, 
        	password : user.password
        });
      },
      createProfile: function (user){
        var profile = {
          username: user.username,
          avatar: 'assassin_avatar.png',
          balance: 1000,
          sitting: false,
          seat: -1
        };

        var profileRef = new Firebase(FIREBASE_URL+'/profile/'+user.uid);
        //add welcome message to mailbox
        var date = new Date();
        var msg = { 
            from: 'Natedaug',
            to: user.username, 
            subject: 'Welcome to the PokerPound!', 
            date: date.toDateString(), 
            body: '   Hi, welcome to the PokerPound. Thanks for signing up. The site is currently under construction. Feel free to pMail  me any questions or comments you may have regarding the site. Stick around, challenge friends and have fun.',
            read: false
          };
          var emailWelcomeMsg = $firebaseArray(profileRef.child('messages'));
          emailWelcomeMsg.$loaded().then(function () {    
            emailWelcomeMsg.$add(msg);
          });
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
        user.email = user.username + '@' + user.username+'.com';
        return auth.$authWithPassword({
        	email : user.email, 
        	password : user.password,
        }, function(){},{
            remember: 'sessionOnly'
          }).then(function(authData){
            $rootScope.$broadcast('$firebaseAuth:authWithPassword',authData);
            return authData;
        });
      },
      logout: function () {
        auth.$unauth();
        $rootScope.$broadcast('$firebaseAuth:unauth');
        $location.path('/');
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