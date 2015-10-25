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

  setTimeout(function () {
    $scope.openMenu();
  });


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
      $state.go('tab.victimMap');
    }
  });

  $scope.login = function() {
    $state.go('tab.victimMap');
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
      $state.go('tab.victimMap');
    }
  }

  $scope.facebook = function() {
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

.service('MapInit', function ($cordovaGeolocation, $ionicSideMenuDelegate, $cordovaGeolocation) {
  var self = this;
  self.init = function($scope) {
    $ionicSideMenuDelegate.canDragContent(false);
    var lat  = '-6.87043';
    var long = '107.58673';
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

  self.currentLocation = function ($scope, callback) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        var coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        // console.log(coords);
        callback(coords);
      });
    }
  }
})

.service('Helper', function () {
  var self = this;
  self.flattenArray = function(data) {
    var list = [];
    for(key in data){
      if(!data[key]) continue;
      data[key].id = key;
      list.push(data[key]);
    }
    return list;
  };
})

.controller('VictimMapCtrl', function ($scope, $http, FBURL, $state, $stateParams, MapInit, $firebaseObject) {
  MapInit.init($scope);
  MapInit.currentLocation($scope, function (coords) {
    $scope.map.center = coords;
  });

  var victims = [];
  var alertColor = "yellow";
  $scope.loadData = function() {
    $http.get(FBURL + "/victims.json").success(function(result){
        for(key in result){
          if(!result[key]) continue;

          if(result[key].status == "Gejala"){
            alertColor = "yellow";
          } else if(result[key].status == "Parah"){
            alertColor = "orange";
          } else if(result[key].status == "Kritis"){
            alertColor = "red";
          }

          victims.push({
            id: key,
            coords: {
              latitude: parseFloat(result[key].latitude),
              longitude: parseFloat(result[key].longitude)
            },
            options: { draggable: false },
            data: result[key],
            alertColor: alertColor,
          });
        }

        $scope.victims = victims;
    })
  };
  $scope.loadData();

  var ref = new Firebase(FBURL);
  var unwatch = $firebaseObject(ref.child('victims')).$watch(function() {
    $scope.loadData();
  });
  $scope.$on('destroy', function() {
    unwatch();
  });
})

.controller('LaporCtrl', function ($scope, $state, $http, FBURL, MapInit, $cordovaCamera, Auth) {
  $scope.data = {};
  MapInit.init($scope);

  $scope.marker = {
    id: 1,
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

  $http.get(FBURL + "/needs.json").success(function(result){
    var list = [];
    for(key in result){
      if(!result[key]) continue;
      result[key].id = key;
      list.push(result[key])
    }
    $scope.needs = list;
  });

  MapInit.currentLocation($scope, function (coords) {
    $scope.marker.coords = coords;
    $scope.map.center = coords;
    $scope.data.latitude = coords.latitude;
    $scope.data.longitude = coords.longitude;
  });

  $scope.submit = function () {
    $scope.data.need_status = "menunggu";
    $http.post(FBURL + '/victims.json', $scope.data)
      .success(function() {
        $state.go('tab.victimMap', {}, {reload: true});
        $http.get(FBURL + '/needs/' + $scope.data.need_id + '.json').success(function(result){
          if (!result.demand) result.demand = 0;
          result.demand = parseInt(result.demand) + parseInt($scope.data.quantity);
          $http.put(FBURL + '/needs/' + $scope.data.need_id + '.json', result);
        });
      });
  }

  $scope.back = function() {
    window.history.back();
  }

  $scope.takePhoto = function() {
    if (Camera) {
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
        $scope.picture = "data:image/jpeg;base64," + imageData;
        $http({
            url:'http://busintime.id:5001/versy/upload',
            method:'POST',
            data:JSON.stringify({file: $scope.picture}),
            headers:{'Content-Type':'application/json'}
        }).success(function (res) {
          $scope.data.photo = res;
        })
        .error(function (reponse) {
          console.log(response);
        });
      }, function(err) {
        alert('error');
      });
    }
  }
})

.controller('SupplyCtrl', function ($scope, $http, FBURL, Auth) {
  $scope.data = {};
  $http.get(FBURL + "/organizations.json").success(function(result){
    var list = [];
    for(key in result){
      if(!result[key]) continue;
      result[key].id = key;
      list.push(result[key])
    }
    $scope.orgs = list;
  });

  $http.get(FBURL + "/needs.json").success(function(result){
    var list = [];
    for(key in result){
      if(!result[key]) continue;
      result[key].id = key;
      list.push(result[key])
    }
    $scope.needs = list;
  });

  $scope.back = function() {
    window.history.back();
  }

  $scope.submit = function () {
    Auth.$onAuth(function(authData) {
      console.log(authData);
      if (authData) {
        $scope.data.donator_id = authData.uid;
      } else {
        $scope.data.donator_id = null;
      }

      $scope.data.status = "pending";

      $http.post(FBURL + '/supplies.json', $scope.data)
        .success(function() {
          alert('Success');
        });

      $http.get(FBURL + '/needs/' + $scope.data.need_id + '.json').success(function(result){
        result.supply = parseInt(result.supply) + parseInt($scope.data.quantity);
        $http.put(FBURL + '/needs/' + $scope.data.need_id + '.json', result);
      });
    });
  }
})

.controller('OrganizationCtrl', function ($scope, $http, FBURL) {
  $scope.data = {};
  $scope.back = function() {
    window.history.back();
  }
  $scope.submit = function () {
    $http.post(FBURL + '/organizations.json', $scope.data)
      .success(function() {
        alert('Success');
      });
  }
})


.controller('TipsCtrl', function ($scope, $http, FBURL) {
  $scope.data = {};
  $http.get(FBURL + '/articles.json').success(function(result){
    var list = [];
    for(key in result){
      if(!result[key]) continue;
      result[key].id = key;
      list.push(result[key])
    }
    $scope.articles = list;
  });
  $scope.back = function() {
    window.history.back();
  }
})


.controller('HazeMapCtrl', function ($scope, $http, FBURL, MapInit, $firebaseObject) {
  MapInit.init($scope);
  MapInit.currentLocation($scope, function (coords) {
    $scope.map.center = coords;
  });

  var detectors = [];
  $scope.loadData = function() {
    $http.get(FBURL + "/smoke-network.json").success(function(result){
        for(key in result){
          if(!result[key]) continue;
          result[key].latestDate = moment(result[key].latestTimestamp).locale('id').format("dddd, MMMM Do YYYY, h:mm:ss a");
          $scope.severityLevel = 1;
          if(result[key].latestValue > 250){
            $scope.severityLevel = 2;
          } else if(result[key].latestValue > 500){
            $scope.severityLevel = 3;
          } else if(result[key].latestValue > 750){
            $scope.severityLevel = 4;
          }

          detectors.push({
            id: key,
            coords: {
              latitude: parseFloat(result[key].latitude),
              longitude: parseFloat(result[key].longitude)
            },
            options: { draggable: false },
            data: result[key]
          });
        }

        $scope.detectors = detectors;
    })
  };
  $scope.loadData();
  var ref = new Firebase(FBURL);
  var unwatch = $firebaseObject(ref.child('smoke-network')).$watch(function() {
    $scope.loadData();
  });
  $scope.$on('destroy', function() {
    unwatch();
  });
})

.controller('VictimCtrl', function ($scope, $stateParams, $http, FBURL, MapInit, Helper) {
  MapInit.init($scope);
  $scope.back = function() {
    window.history.back();
  }
  $scope.marker = {
    id: 1,
    options: { draggable: false },
  };
  $http.get(FBURL + "/needs.json").success(function (needs){
    var list = Helper.flattenArray(needs);
    $http.get(FBURL + "/victims/" + $stateParams.id + ".json").success(function(result){
      $scope.data = result;
      $scope.data.need = _.findWhere(list, {id: $scope.data.need_id});
      var coords = {
        latitude: $scope.data.latitude,
        longitude: $scope.data.longitude
      };
      $scope.marker.coords = coords;
      $scope.map.center = coords;
    })
  });
})

.controller('NeedsCtrl', function ($scope, $http, FBURL, Helper, $firebaseObject) {
  $scope.knobOptions = {
    width: 45,
    fgColor: "#ff0",
    thickness: .2,
    displayPrevious: true
  };
  $scope.loadData = function() {
    $http.get(FBURL + '/needs.json').success(function (needs) {
      $scope.needs = _.map(Helper.flattenArray(needs), function (item) {
        item.percent = parseInt(item.supply) / parseInt(item.demand) * 100;
        return item;
      });
    });
  };
  $scope.loadData();
  var ref = new Firebase(FBURL);
  var unwatch = $firebaseObject(ref.child('needs')).$watch(function() {
    $scope.loadData();
  });
  $scope.$on('destroy', function() {
    unwatch();
  });
})

.controller('OrganizationsCtrl', function ($scope, $http, FBURL, Helper) {
  $http.get(FBURL + '/organizations.json').success(function (result) {
    var orgs = [];
    for(key in result){
      if(!result[key]) continue;
      result[key].id = key;
      orgs.push(result[key])
    }
    $scope.orgs = orgs;
  });
})

.controller('ManageDonationsCtrl', function ($scope, $http, FBURL, Helper) {
  $http.get(FBURL + '/supplies.json').success(function (result) {
    $http.get(FBURL + '/needs.json').success(function(needs){
      $http.get(FBURL + '/organizations.json').success(function(orgs){
        $http.get(FBURL + '/users.json').success(function(users){
          var supplies = [];
          for(key in result){
            if(!result[key]) continue;
            result[key].id = key;

            var tmpSupply = result[key];

            tmpSupply.user = _.findWhere(Helper.flattenArray(users), {id: tmpSupply.donator_id});
            tmpSupply.need = _.findWhere(Helper.flattenArray(needs), {id: tmpSupply.need_id});
            tmpSupply.org = _.findWhere(Helper.flattenArray(orgs), {id: tmpSupply.org_id});

            console.log(tmpSupply);

            supplies.push(tmpSupply);
          }
          $scope.supplies = supplies;
        });
      });
    });
  });


  $scope.nextStatus = function(supply){
    if(supply.status == "pending"){
      supply.status = "diproses";
    } else if(supply.status == "diproses"){
      supply.status = "diterima";
    }

    $http.put(FBURL + "/supplies/" + supply.id + ".json", supply);
  }
})

.controller('ManageVictimsCtrl', function ($scope, $http, FBURL, Helper) {

  $http.get(FBURL + "/victims.json").success(function(result){
    $http.get(FBURL + '/needs.json').success(function(needs){
      var victims = [];
      for(key in result){
        if(!result[key]) continue;
        result[key].id = key;

        var tmpVictim = result[key];

        tmpVictim.need = _.findWhere(Helper.flattenArray(needs), {id: tmpVictim.need_id});
        victims.push(tmpVictim);
      }

      $scope.victims = victims;
    });
  });

  $scope.nextStatus = function(victim){
    if(victim.status == "menunggu"){
      victim.status = "terpenuhi";
    }

    $http.put(FBURL + "/victims/" + victim.id + ".json", victim);
  }
});