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

  // ionic.on('resize',function() {
  //   ionic.off('resize',null,window);
  //   self.positionView(target,modalEl);
  // },window);
})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('HomeCtrl', function($scope, ArchiveImage, Commodities, $ionicPopover) {
  $scope.commodities = Commodities;
  $scope.commodities.$loaded(function (snaphot) {
    console.log($scope.commodities);
  });
  $ionicPopover.fromTemplateUrl('templates/homepopover.html', {
      scope: $scope,
  }).then(function(popover) {
      $scope.popover = popover;
  });

  $scope.menu = {
    searchActive: false,
    toggleSearch: function() {
      $scope.menu.searchActive = !$scope.menu.searchActive;
    }
  }

})

.service('VerseService', function(Verse, Favorites, $sce, $cordovaSocialSharing) {
  return function($scope) {
    $scope.isLike = false;
    $scope.verse = {};

    $scope.like = function() {
      console.log('like');
      $scope.isLike = !$scope.isLike;
      if ($scope.isLike) {
        Favorites.add($scope.verse);
      } else {
        Favorites.remove($scope.verse);
      }
    }

    $scope.share = function() {
      $cordovaSocialSharing
        .shareViaFacebook("Read encouraging words here", null, "http://warungsatekamu.org/")
        .then(function(result) {
          alert('Sharing succeed.');
        }, function(err) {
          alert('Sharing failed.');
        });
    }
  };
})

.controller('VerseCtrl', function($scope, $stateParams, Verse, Favorites, $sce, VerseService) {
  VerseService($scope);

  Verse.findById($stateParams.id).then(function (data) {
    $scope.verse = data;
    $scope.verse.content = $sce.trustAsHtml($scope.verse.content);
    $scope.isLike = Favorites.isLike($scope.verse);
  });
})

.controller('TodayCtrl', function($scope, Verse, Favorites, VerseService) {
  VerseService($scope);

  Verse.findByToday().then(function (data) {
    $scope.verse = data;
    $scope.isLike = Favorites.isLike($scope.verse);
  });

})

.controller('DevotionsCtrl', function($scope, Devotions, $stateParams, $ionicLoading, $timeout) {
  $scope.devotions = [];
  $scope.page = 1;
  $scope.finish = false;

  $scope.loadMore = function() {
    if (!$scope.finish) {
      $ionicLoading.show({
        template: 'Loading...'
      });
      Devotions.findByMonth($stateParams.month, $stateParams.year, $scope.page).then(function(data) {
        if (data.length == 0) {
          $scope.finish = true;
        }
        $scope.devotions = Devotions.all($stateParams.month, $stateParams.year);
        $scope.page++;
        $scope.$broadcast('scroll.infiniteScrollComplete');
        $timeout(function() {
          $ionicLoading.hide();
        }, 1500);
      }, function () {
        $ionicLoading.hide();
      });
    } else {
      $ionicLoading.hide();
    }
  }
  $scope.$on('$stateChangeSuccess', function() {
    $scope.loadMore();
  });
})

.controller('FavoritesCtrl', function($scope, Favorites, $stateParams) {
  $scope.devotions = [];
  $scope.load = function() {
    Favorites.getAll().then(function(data) {
      // console.log('happy');
      console.log(data);
      $scope.devotions = data;
    });
  }
  $scope.$on('$ionicView.beforeEnter', $scope.load);
  $scope.confirmDelete = function(item) {
    console.log(item);
    Favorites.remove(item);
    $scope.load();
  }
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
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
    // $cordovaOauth.facebook(FB_APP_ID, ["email"]).then(function(result) {
    //   Auth.$authWithOAuthToken("facebook", result.access_token).then($scope.succeed, function(error) {
    //     console.error("ERROR: " + error);
    //   });
    // }, function(error) {
    //   console.log("ERROR: " + error);
      Auth.$authWithOAuthPopup("facebook").then($scope.succeed).catch(function(error) {
        console.log("Authentication failed:", error);
      });
    // });
  }

  $scope.google = function() {
    // $cordovaOauth.google(GOOGLE_APP_ID, ["email"]).then(function(result) {
    //   Auth.$authWithOAuthToken("google", result.access_token).then($scope.succeed, function(error) {
    //     console.error("ERROR: " + error);
    //   });
    // }, function(error) {
      // console.log("ERROR: " + error);
      Auth.$authWithOAuthPopup("google").then($scope.succeed).catch(function(error) {
        console.log("Authentication failed:", error);
      });
    // });
  }
})

.controller('MarketCtrl', function($scope, $state, $stateParams, $ionicSideMenuDelegate) {
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
  $scope.markets = [{
    id: 1,
    coords: {
      latitude: -6.2398054,
      longitude: 106.8113921
    },
    options: { draggable: false },
  },{
    id: 2,
    coords: {
      latitude: -6.2398054,
      longitude: 106.8114000
    },
    options: { draggable: false },
  },{
    id: 3,
    coords: {
      latitude: -6.2430470,
      longitude: 106.8247076
    },
    options: { draggable: false },
  }];

  $scope.test = {
    forceToMarket : function(){
    console.log("HEHE");
    $state.go('app.marketSingle');
  }}
})

.controller('MarketSingleCtrl', function($scope, $stateParams) {
})

.controller('NonMarketCtrl', function($scope, $state, $stateParams, $ionicSideMenuDelegate) {
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
  $scope.markets = [{
    id: 1,
    coords: {
      latitude: -6.2398054,
      longitude: 106.8113921
    },
    options: { draggable: false },
  },{
    id: 2,
    coords: {
      latitude: -6.2398054,
      longitude: 106.8114000
    },
    options: { draggable: false },
  },{
    id: 3,
    coords: {
      latitude: -6.2430470,
      longitude: 106.8247076
    },
    options: { draggable: false },
  }];

  $scope.test = {
    forceToMarket : function(){
    $state.go('app.nonMarketSingle');
  }}
})

.controller('NonMarketSingleCtrl', function($scope, $stateParams) {
})

.controller('KirimKatalogCtrl', function($scope, Camera, $stateParams, $cordovaSms) {
  $scope.data = {
    title: "",
    price: "",
    stock: ""
  };

  $scope.test = {
    submit : function(){
      $state.go('app.home');
    },
    takeCamera : function(){
      Camera.getPicture().then(function(imageURI) {
        console.log(imageURI);
        $scope.data.picture = imageURI;
      }, function(err) {
        console.err(err);
      }, {
        quality: 75,
        targetWidth: 320,
        targetHeight: 320,
        saveToPhotoAlbum: false,
        sourceType: 0,
        correctOrientation: false
      });
    },
    sms : function() {
      var options = {
          replaceLineBreaks: false, // true to replace \n by a new line, false by default
          android: {
              intent: 'INTENT'  // send SMS with the native android SMS messaging
          }
      };
      $cordovaSms
      .send('085722201351', $scope.data.title + " " + $scope.data.price + " " + $scope.data.stock, options)
      .then(function() {
        // Success! SMS was sent
        console.log("Sukses");
      }, function(error) {
        // An error occurred
        console.log("Error " + error);
      });
    }
  }
})

.controller('LaporHargaCtrl', function($scope, Camera, $stateParams, $cordovaSms) {
  $scope.data = {
    title: "",
    price: "",
    market: ""
  };

  $scope.test = {
    submit : function(){
      $state.go('app.home');
    },
    takeCamera : function(){
      Camera.getPicture().then(function(imageURI) {
        console.log(imageURI);
        $scope.data.picture = imageURI;
      }, function(err) {
        console.err(err);
      }, {
        quality: 75,
        targetWidth: 320,
        targetHeight: 320,
        saveToPhotoAlbum: false,
        sourceType: 0,
        correctOrientation: false
      });
    },
    sms : function() {
      console.log("HI");
      var options = {
          replaceLineBreaks: false, // true to replace \n by a new line, false by default
          android: {
              intent: 'INTENT'  // send SMS with the native android SMS messaging
              //intent: '' // send SMS without open any other app
          }
      };
      $cordovaSms
      .send('085722201351', $scope.data.title + " " + $scope.data.price + " " + $scope.data.market, options)
      .then(function() {
        // Success! SMS was sent
        console.log("Sukses");
      }, function(error) {
        // An error occurred
        console.log("Error " + error);
      });
    }
  }
})

.controller('LaporPasarCtrl', function($scope, Camera, $stateParams, $ionicSideMenuDelegate, $cordovaSms) {
  $ionicSideMenuDelegate.canDragContent(false);
  $scope.data = {
    title: "",
    longitude: "",
    latitude: ""
  };

  var lat  = '-6.2398054';
  var long = '106.8113921';
  $scope.map = {center: {latitude: lat, longitude: long }, zoom: 16};
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

  $scope.test = {
    submit : function(){
      $state.go('app.home');
    },
    sms : function() {
      console.log("HAI");
      var options = {
          replaceLineBreaks: false, // true to replace \n by a new line, false by default
          android: {
              intent: 'INTENT'  // send SMS with the native android SMS messaging
              //intent: '' // send SMS without open any other app
          }
      };
      $cordovaSms
      .send('085722201351', $scope.data.title + " " + $scope.data.price + " " + $scope.data.market, options)
      .then(function() {
        // Success! SMS was sent
        console.log("Sukses");
      }, function(error) {
        // An error occurred
        console.log("Error " + error);
      });
    }
  }

})

.controller('KontribusiCtrl', function($scope, $stateParams) {
})

.controller('PencapaianCtrl', function($scope, $stateParams) {
})

.controller('BantuanCtrl', function($scope, $stateParams) {
})

.controller('ShareCtrl', function($scope, $stateParams) {

})

.controller('TimelineCtrl', function($scope) {})

.controller('CommoditySingleCtrl', function($scope) {
  $scope.chartConfig = {
    options: {
      chart: {
        type: 'line'
      }
    },
    series: [{
        data: [10, 15, 12, 8, 7]
    }],
    title: {
        text: ''
    },
    loading: false,
    yAxis: {
      title: {
        text: ''
      },

    },
    xAxis: {

    },
    legend: {
      enabled: false,
    },
  };
});
