(function () {
  'use strict';

  angular
    .module('core')
    .controller('HeaderController', HeaderController);

  HeaderController.$inject = ['$scope', '$state', 'Authentication', 'menuService', '$rootScope'];

  function HeaderController($scope, $state, Authentication, menuService, $rootScope) {
    var vm = this;

    vm.accountMenu = menuService.getMenu('account').items[0];
    vm.authentication = Authentication;
    vm.isCollapsed = false;
    vm.menu = menuService.getMenu('topbar');
    vm.dayInterval = 0;
    vm.filterChanged = filterChanged;

    $scope.$on('$stateChangeSuccess', stateChangeSuccess);

    function stateChangeSuccess() {
      // Collapsing the menu after navigation
      vm.isCollapsed = false;
    }
    function filterChanged() {
      var data = {
        dayInterval: vm.dayInterval
      };
      if (this.getPlace != null) {
        var place = this.getPlace();
        if (place == null || place.geometry == null || place.geometry.location == null)
          return;
        var loc = place.geometry.location;
        data.lat = loc.lat();
        data.lng = loc.lng();
      }
      $rootScope.$emit('event:filter-changed', data);
    }
  }
}());
