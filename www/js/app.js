// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('versinfocus', [
  'firebase',
  'ionic',
  'versinfocus.controllers',
  'versinfocus.services',
  'versinfocus.directives',
  'versinfocus.users',
  'ngStorage',
  'ngCordova',
  'highcharts-ng',
  'uiGmapgoogle-maps',
  'ui.knob'
])

.constant('FBURL', 'https://bantu-asap.firebaseio.com')

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  $ionicConfigProvider.views.maxCache(0);
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl',
  })

  .state('login', {
    url: "/login",
    templateUrl: "templates/login.html",
    controller: 'LoginCtrl'
  })

  /// 
  .state('tab', {
    url: "/tab",
    controller: 'AppCtrl',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  .state('lapor', {
    url: '/lapor',
    templateUrl: 'templates/lapor.html',
    controller: 'LaporCtrl',
  })

  .state('victim', {
    url: '/victim/:id',
    templateUrl: 'templates/victim.html',
    controller: 'VictimCtrl',
  })

  .state('supply', {
    url: '/supply',
    templateUrl: 'templates/supply.html',
    controller: 'SupplyCtrl',
  })

  .state('organization', {
    url: '/organization',
    templateUrl: 'templates/organization.html',
    controller: 'OrganizationCtrl'
  })

  .state('organizations', {
    url: '/organizations',
    templateUrl: 'templates/organizations.html',
    controller: 'OrganizationsCtrl'
  })

  .state('tips', {
    url: '/tips',
    templateUrl: 'templates/tips.html',
    controller: 'TipsCtrl'
  })

  .state('tab.hazeMap', {
    url: '/haze-map',
    views: {
      'tab-haze-map': {
        templateUrl: 'templates/haze-map.html',
        controller: 'HazeMapCtrl',
        resolve: {
          currentAuth: function(Auth) {
            return Auth.$waitForAuth();
          },
        },
      }
    }
  })

  .state('helpMap', {
    url: "/help-map",
    views: {
      'menuContent': {
        templateUrl: "templates/help-map.html",
        controller: 'HelpMapCtrl'
      }
    }
  })

  .state('tab.victimMap', {
    url: "/victim-map",
    views: {
      'tab-victim-map': {
        templateUrl: 'templates/victim-map.html',
        controller: 'VictimMapCtrl',
        resolve: {
          currentAuth: function(Auth) {
            return Auth.$waitForAuth();
          },
        },
      }
    }
  })

  .state('tab.needs', {
    url: '/needs',
    views: {
      'tab-needs': {
        templateUrl: 'templates/needs.html',
        controller: 'NeedsCtrl',
        resolve: {
          currentAuth: function (Auth) {
            return Auth.$waitForAuth();
          }
        }
      }
    }
  });
  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/victim-map');
});
