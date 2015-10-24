angular.module('versinfocus.services', [])

.factory('Camera', function($q, $cordovaCamera) {

  return {
    getPicture: function(options) {

        var def = $q.defer();

        var options = {
          quality: 50,
          destinationType: Camera.DestinationType.FILE_URI,
          sourceType: Camera.PictureSourceType.CAMERA,
          allowEdit: false,
          encodingType: Camera.EncodingType.JPEG,
          targetWidth: 480,
          targetHeight: 360,
          saveToPhotoAlbum: true
        };

        $cordovaCamera.getPicture(options).then(function(imageURI) {
          // var image = document.getElementById('myImage');
          // image.src = "data:image/jpeg;base64," + imageData;
          // q.resolve("data:image/jpeg;base64," + imageData);
          console.log(imageURI);
          def.resolve(imageURI);
        }, function(err) {
          // error
          def.reject(err);
        });

        // navigator.camera.getPicture(function(result) {
        // // Do any magic you need
        // q.resolve(result);
        // }, function(err) {
        // q.reject(err);
        // }, options);

        return def.promise;
    }
  }
})

.factory('ArchiveImage', function($http, $q) {
  var self = this;

  self.images = [];

  self.getItem = function(page) {
    var def = $q.defer();
    $http.jsonp('http://www.warungsatekamu.org/api/get_category_posts/?category_id=5&page='+page+'&callback=JSON_CALLBACK').success(function (data) {
      // console.log(data);
      def.resolve(data.posts);
    });
    return def.promise;
  }

  self.getAll = function() {
    if (self.images.length == 0) {
      self.images = $q.all([self.getItem(1), self.getItem(2)]).then(function (res) {
        // console.log(res[0].concat(res[1]));
        return res[0].concat(res[1]);
      });
      return self.images;
    } else {
      return self.images;
    }
  }

  return self;
})

.factory('Favorites', function($http, $q,  $localStorage) {
  var self = this;

  if ($localStorage.favorites == null) $localStorage.favorites = [];
  self.favorites = $localStorage.favorites;

  self.add = function(item) {
    if (item.id) {
      var search = _.findWhere(self.favorites, {id: item.id});
      if (!search) { //not found
        self.favorites.push(item);
      }
    }
  }

  self.remove = function(item) {
    self.favorites = _.without(self.favorites, _.findWhere(self.favorites, {id: item.id}));
    $localStorage.favorites = self.favorites;
  }

  self.getAll = function() {
    return $q.all(self.favorites);
  }

  self.isLike = function(item) {
    var search = _.findWhere(self.favorites, {id: item.id});
    if (search) return true; else return false;
  }

  return self;
})

.factory('Devotions', function($http, $q) {
  var self = this;

  self.devotions = [];
  self.latest = [];

  self.all = function(month, year) {
    var all = _.where(self.devotions, {month: month, year: year});
    var result = [];
    var currentpage = 0;
    _.each(all, function(item, i) {
      result = result.concat(item.posts);
    });
    return result;
  }

  self.findByMonth = function(month, year, page) {
    var def = $q.defer();
    var search = _.findWhere(self.devotions, {month: month, year: year, page: page});
    if (search) {
      def.resolve(search.posts);
    } else {
      $http.jsonp('http://www.warungsatekamu.org/api/get_date_posts/?date='+moment(year + '-' + month).format('YYYY-MM')+'&page='+page+'&callback=JSON_CALLBACK').success(function (data) {
        var posts = data.posts;
        posts = _.filter(posts, function (item) {
          return _.findWhere(item.categories, {id: 1});
          // return true;
        });
        self.devotions.push({
          month: month,
          year: year,
          page: page,
          posts: posts
        });
        def.resolve(posts);
      });
    }
    return def.promise;
  }

  self.getLatest = function() {
    var def = $q.defer();
    var loadAgain = function() {
      $http.jsonp('http://www.warungsatekamu.org/api/get_date_posts/?date='+moment().format('YYYY-MM-DD')+'&callback=JSON_CALLBACK').success(function (data) {
        // console.log(data);
        self.latest = data.posts;
        def.resolve(data.posts);
      });
    }
    console.log(self.latest);
    if (self.latest.length == 0) {
      loadAgain();
    } else {
      def.resolve(self.latest);
    }
    return def.promise;
  }

  return self;
})

.directive('fader', function ($timeout, $ionicGesture, $ionicSideMenuDelegate) {
  return {
    restrict: 'E',
    require: '^ionSideMenus',
    scope: true,
    link: function($scope, $element, $attr, sideMenuCtrl) {
      $ionicGesture.on('tap', function(e) {
        $ionicSideMenuDelegate.toggleRight(true);
      }, $element);
      $ionicGesture.on('dragleft', function(e) {
        sideMenuCtrl._handleDrag(e);
        e.gesture.srcEvent.preventDefault();
      }, $element);
      $ionicGesture.on('dragright', function(e) {
        sideMenuCtrl._handleDrag(e);
        e.gesture.srcEvent.preventDefault();
      }, $element);
      $ionicGesture.on('release', function(e) {
        sideMenuCtrl._endDrag(e);
      }, $element);
      $scope.sideMenuDelegate = $ionicSideMenuDelegate;
      $scope.$watch('sideMenuDelegate.getOpenRatio()', function(ratio) {
        if (Math.abs(ratio)<1) {
          $element[0].style.zIndex = "1";
          $element[0].style.opacity = 0.7-Math.abs(ratio);
        } else {
          $element[0].style.zIndex = "-1";
        }
      });
    }
  }
})

.factory('Verse', function($http, $q, Devotions) {
  var self = this;
  self.verses = [];

  self.findById = function(id) {
    var def = $q.defer();
    var search = _.findWhere(self.verses, {id: id});
    if (search) {
      def.resolve(search);
    } else {
      $http.jsonp('http://www.warungsatekamu.org/api/get_post/?post_id='+id+'&callback=JSON_CALLBACK').success(function (data) {
        // console.log(data);
        self.verses.push(data.post);
        def.resolve(data.post);
      });
    }
    return def.promise;
  }

  self.findByToday = function() {
    var def = $q.defer();
    Devotions.getLatest().then(function (data) {
      var today = _.filter(data, function (item) {
        return _.findWhere(item.categories, {id: 1});
      });
      self.findById(today[0].id).then(function (item) {
        def.resolve(item);
      })
    });
    return def.promise;
  }

  return self;
})

.directive('canDragMenu', function ($timeout, $ionicGesture, $ionicSideMenuDelegate) {
  return {
    restrict: 'A',
    require: '^ionSideMenus',
    scope: true,
    link: function($scope, $element, $attr, sideMenuCtrl) {
      $ionicGesture.on('dragleft', function(e) {
        sideMenuCtrl._handleDrag(e);
        e.gesture.srcEvent.preventDefault();
      }, $element);
      $ionicGesture.on('dragright', function(e) {
        sideMenuCtrl._handleDrag(e);
        e.gesture.srcEvent.preventDefault();
      }, $element);
      $ionicGesture.on('release', function(e) {
        sideMenuCtrl._endDrag(e);
      }, $element);
    }
  }
})

.factory("Commodities", function($firebaseArray, FBURL) {
  var ref = new Firebase(FBURL);
  var commodity = ref.child('commodity');
  return $firebaseArray(commodity);
})
