'use strict';
/*jshint unused: false, undef:false */
/**
 * @ngdoc overview
 * @name thePokerPound20App
 * @description
 * # thePokerPound20App
 *
 * Main module of the application.
 */
var app = angular
  .module('thePokerPound20App', [
    'firebase',
    'ngAnimate',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'luegg.directives',
    'angular-progress-arc'
  ])
  .constant('FIREBASE_URL', 'https://pokerpound.firebaseio.com/')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        resolve: {
          user: function(Auth) {
            return Auth.resolveUser();
          }
        }
      })
      .when('/register', {
        templateUrl: 'views/register.html',
        controller: 'AuthCtrl',
        resolve: {
          user: function(Auth) {
            return Auth.resolveUser();
          }
        }
      })
      .when('/AngPoker', {
        templateUrl: 'views/angpoker.html',
        controller: 'AngPokerController',
        //authRequired: true,
        resolve: {
          user: function(Auth) {
            return Auth.resolveUser();
          }
        }
      })
      .when('/pokerroom/:roomid', {
        templateUrl: 'views/pokerroom.html',
        controller: 'PokergameCtrl',
        resolve: {
          user: function(Auth) {
            return Auth.resolveUser();
          }
        }
      })
      .otherwise({
        redirectTo: '/'
      });
  }).run(['$rootScope', '$location', function($rootScope, $location) {
    $rootScope.$on('$routeChangeError', function(event, next, previous, error) {
      // We can catch the error thrown when the $requireAuth promise is rejected
      // and redirect the user back to the home page
      if (error === 'AUTH_REQUIRED') {
        $location.path('/register');
      }
    });
}]);
