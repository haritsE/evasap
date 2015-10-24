angular.module('versinfocus.users', [])

.factory("Auth", function($firebaseAuth, FBURL) {
  var ref = new Firebase(FBURL);
  return $firebaseAuth(ref);
})

.service('AuthHelper', function() {
  var self = this;
  self.getName = function (authData) {
    if (!authData) return;
    switch(authData.provider) {
      case 'google':
        return authData.google.displayName;
      case 'facebook':
        return authData.facebook.displayName;
    }
  };
  self.getPicture = function (authData) {
    if (!authData) return;
    switch(authData.provider) {
      case 'google':
        return authData.google.cachedUserProfile.picture;
      case 'facebook':
        return authData.facebook.cachedUserProfile.picture.data.url;
    }
  }
  return self;
});