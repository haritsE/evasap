angular.module('versinfocus.directives', [])

.directive('time', function() {
    return {
        restrict: 'A',
        scope: {
            number: '=number',
            format: '=format',
        },
        template: '{{formatted}}',
        link: function (scope, element) {
            scope.$watch('number', function() {

                scope.formatted = moment(scope.number).format(scope.format);
            });
            scope.formatted = moment(scope.number).format(scope.format);
        }
    }
})

.filter('dateDay', function() {
  return function(input) {
    input = input || '';
    var out = "";
    out = moment(input).format('dddd, MMMM D YYYY');
    if (out == 'Invalid date') {
        out = 'Loading...';
    }
    return out;
  };
})

.filter('dateMonth', function() {
  return function(input) {
    input = input || '';
    var out = "";
    out = moment(input).format('MMMM YYYY');
    if (out == 'Invalid date') {
        out = 'Loading...';
    }
    return out;
  };
});