angular.module('versinfocus.controllers', ['ionic'])

.controller('AppCtrl', function($scope, $ionicModal, $ionicPopover, $timeout, $window, $ionicSideMenuDelegate, $state, $rootScope, Auth, AuthHelper) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $rootScope.$on('$stateChangeStart', function(event){
    if ($scope.popover) {
      $scope.popover.hide();
    }
  });

  $scope.width = $window.innerWidth;

  $scope.openMenu = function() {
    $ionicSideMenuDelegate.toggleLeft(true);
  };

  $scope.logout = function() {
    $scope.auth.$unauth();
  };

  $scope.isWalletShown = false;
  $scope.toggleWallet = function () {
    $scope.isWalletShown = $scope.isWalletShown === false ? true : false;
    console.log('Toggled');
  }

  $scope.authHelper = AuthHelper;
  $scope.auth = Auth;

  $scope.auth.$onAuth(function(authData) {
    if (authData) {
      $scope.authData = authData;
    } else {
      $state.go('login');
    }
  });

  $scope.activeMenu = 'app.home';

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    $scope.activeMenu = toState.name;
  });

})

.controller('HomeCtrl', function($scope, ArchiveImage, Commodities, $ionicPopover) {

})

.controller('LoginCtrl', function($scope, $state, $firebaseAuth, $cordovaOauth, FBURL, Auth, AuthHelper) {
  $scope.auth = Auth;
  $scope.auth.$onAuth(function(authData) {
    console.log(authData);
    if (authData) {
      $state.go('app.home');
    }
  });

  $scope.login = function() {
    $state.go('app.home');
  }

  $scope.succeed = function(authData) {
    console.log(authData);
    if (authData) {
      var ref = new Firebase(FBURL);
      ref.child("users").child(authData.uid).set({
        provider: authData.provider,
        name: AuthHelper.getName(authData),
        picture: AuthHelper.getPicture(authData)
      });
      $state.go('busintime.getbus');
    }
  }

  $scope.facebook = function() {
    console.log("CLICKED!!!!!");
      Auth.$authWithOAuthPopup("facebook").then($scope.succeed).catch(function(error) {
        console.log("Authentication failed:", error);
      });
  }

  $scope.google = function() {
      Auth.$authWithOAuthPopup("google").then($scope.succeed).catch(function(error) {
        console.log("Authentication failed:", error);
      });
  }
})

.service('MapInit', function ($cordovaGeolocation, $ionicSideMenuDelegate) {
  var self = this;
  self.init = function($scope) {
    $ionicSideMenuDelegate.canDragContent(false);
    var lat  = '-6.2398054';
    var long = '106.8113921';
    $scope.map = {center: {latitude: lat, longitude: long }, zoom: 16 };
    $scope.options = {
      scrollwheel: false,
      overviewMapControl: false,
      panControl: true,
      scaleControl: true,
      scrollwheel: false,
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: true
    };
  }
})

.controller('MarketCtrl', function($scope, $state, $stateParams, $ionicSideMenuDelegate) {
  
  $scope.markets = [];

})

.controller('LaporCtrl', function ($scope, $http, FBURL, $ionicSideMenuDelegate, MapInit, $cordovaCamera, $cordovaGeolocation) {
  $scope.data = {};
  MapInit.init($scope);

  $scope.marker = {
    id: 1,
    coords: {
      latitude: -6.2398054,
      longitude: 106.8113921
    },
    options: { draggable: true },
    events: {
      dragend: function (marker, eventName, args) {
        var lat = marker.getPosition().lat();
        var lon = marker.getPosition().lng();
        $scope.data.latitude = lat;
        $scope.data.longitude = lon;
      }
    }
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
      console.log(coords);
      $scope.marker.coords = coords;
      $scope.map.center = coords;
      $scope.data.latitude = coords.latitude;
      $scope.data.longitude = coords.longitude;
    });
  } 
  if ($cordovaGeolocation) {
    var posOptions = {timeout: 10000, enableHighAccuracy: false};
    $cordovaGeolocation
      .getCurrentPosition(posOptions)
      .then(function (position) {
        console.log(position);
        alert('masuk 2');
        var coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        console.log(coords);
        $scope.marker.coords = coords;
        $scope.map.center = coords;
        $scope.data.latitude = coords.latitude;
        $scope.data.longitude = coords.longitude;
      }, function(err) {
        // error
      });
  }

  $scope.submit = function () {
    $http.post(FBURL + '/victims/.json', $scope.data)
      .success(function() {
        alert('success');
      });
  }

  $scope.takePhoto = function() {
    var options = {
      quality: 80,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 500,
      targetHeight: 360,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: true,
      correctOrientation:true
    };

    $cordovaCamera.getPicture(options).then(function (imageData) {
      alert('beres');
      $scope.picture = "data:image/jpeg;base64," + imageData;
    }, function(err) {
      alert('error');
    });
  }
})
;
