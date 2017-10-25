(function () {
  'use strict';

  angular
    .module('events')
    .controller('EventsListController', EventsListController);

  EventsListController.$inject = ['EventsService', 'NgMap', '$http', '$timeout', '$rootScope', 'Authentication', '$q'];

  function EventsListController(EventsService, NgMap, $http, $timeout, $rootScope, Authentication, $q) {
    var vm = this;
    var baseUrl = "http://localhost:3000/";
    function updateLatLng() {
      vm.latlng = [vm.lat, vm.lng];
      searchEvents();
      getPublicEvents();
    }
    vm.events = [];
    vm.token = "";
    var now = moment();
    vm.start = now.hours(0).minutes(0).seconds(0).unix();
    vm.end = endTimeOfDay(now).unix();
    vm.isLoading = false;
    function endTimeOfDay(day) {
      return day.hours(23).minutes(59).seconds(59);
    }
    function searchEvents() {
      EventsService.query({
        lat: vm.lat,
        lng: vm.lng,
        since: vm.start,
        until: vm.end,
        distance: 1000,
        sort: "venue",
        accessToken: "1643698609246838|x5PaPO_3sPq-hbaHksVGSftGn5c"
      }, function (events) {
        vm.isLoading = false;
        events.forEach(function (event) {
          if (_.find(vm.events,
            function (e) {
              return e.id == event.id;
            }) !=
            null)
            return;
          vm.events.push(event);
        });
      });
    }
    function addEvents(events) {
      events.forEach(function (event) {
        if (_.find(vm.events,
          function (e) {
            return e.id == event.id;
          }) !=
          null)
          return;
        vm.events.push(event);
      });
    }
    function getPublicEvents() {
      EventsService.query({
        type: 'public',
        since: vm.start,
        until: vm.end,
        distance: 1000,
        sort: "venue",
      }, function (events) {
        vm.isLoading = false;
        addEvents(events);
      });
    }
    function getEventsByPageUserLiked() {
      EventsService.query({
        type: 'pages',
        lat: vm.lat,
        lng: vm.lng,
        since: vm.start,
        until: vm.end,
        distance: 10000,
        sort: 'venue',
        accessToken: vm.token
      }, function (events) {
        addEvents(events)
      })
    }

    function getUserEvents() {
      vm.isLoading = true;
      $http.get(
        'https://graph.facebook.com/v2.10/me/events?fields=id,type,name,start_time,end_time,description,picture.type(large),cover.fields(id,source),place.fields(id,name,location)&access_token=' + $scope.token)
        .success(function (data) {
          data.data.forEach(function (event) {
            if (event.place == null || _.find(vm.events,
              function (e) {
                return e.id == event.id;
              }) !=
              null)
              return;
            event.coverPicture = (event.cover ? event.cover.source : null);
            event.profilePicture = (event.picture ? event.picture.data.url : null);
            event.startTime = (event.start_time ? event.start_time : null);
            event.endTime = (event.end_time ? event.end_time : null);
            if (event.ticketing_terms_uri || event.ticketing_privacy_uri || event.ticket_uri) {
              event.ticketing = {};
              if (event.ticket_uri) event.ticketing.ticket_uri = event.ticket_uri;
              if (event.ticketing_terms_uri) event.ticketing.terms_uri = event.ticketing_terms_uri;
              if (event.ticketing_privacy_uri) event.ticketing.privacy_uri = event.ticketing_privacy_uri;
            }
            vm.events.push(event);
          });
          vm.isLoading = false;
        })
        .error(function (error) {
          vm.isLoading = false;
          alert('error when get data');
        });
    }

    $rootScope.$on('event:filter-changed', function (event, data) {
      if (data.lat)
        vm.lat = data.lat;
      if (data.lng)
        vm.lng = data.lng;
      if (data.dayInterval != vm.oldInterval)
        vm.events = [];
      vm.oldInterval = data.dayInterval;
      switch (data.dayInterval) {
        case "0":
          vm.end = endTimeOfDay(moment()).unix();
          break;
        case "3":
          vm.end = endTimeOfDay(moment().day(3)).unix();
          break;
        case "7":
          vm.end = endTimeOfDay(moment().day(7)).unix();
          break;
        case "30":
          vm.end = endTimeOfDay(moment().day(30)).unix();
          break;
      }
      updateLatLng();
    });
    navigator.geolocation.getCurrentPosition(function (pos) {
      if (pos.coords == null) {
        alert('can not get your location');
        return;
      }
      vm.lat = pos.coords.latitude, vm.lng = pos.coords.longitude;
      NgMap.getMap().then(function (map) {
        vm.map = map;
        updateLatLng();
      });


      vm.showInfo = function (e, index) {
        vm.event = vm.events[index];
        vm.map.showInfoWindow('infowindow', vm.event.id);
      }
      vm.showPinInfo = function () {
        vm.map.showInfoWindow('infoPin', 'pin');
      }
      vm.searchHere = function () {
        updateLatLng();
      }
      vm.markerChange = function (event) {
        vm.lat = event.latLng.lat();
        vm.lng = event.latLng.lng();
      };
      vm.silentMode = true;
      var isSilent = false;
      var scopes = 'email,user_events,user_likes';
      var permisions = {};
      function fbEnsureInit(callback) {
        if (!window.fbApiInit) {
          setTimeout(function () { fbEnsureInit(callback); }, 50);
        } else {
          if (callback) {
            callback();
          }
        }
      }

      var permisions = [];
      fbEnsureInit(function () {
        FB.getLoginStatus(function (response) {
          if (response.status === "connected") {
            FB.api('/me/permissions',
              function (presponse) {
                permisions = presponse;
                if (vm.silentMode) {
                  isSilent = true;
                  $timeout(function () {
                    getToken();
                  }, 500);
                }
              });
          }
        });
      });
      function getToken() {
        var fetchUserDetails = function () {
          var deferred = $q.defer();
          FB.api('/me?fields=name,email,picture', function (res) {
            if (!res || res.error) {
              deferred.reject('Error occured while fetching user details.');
            } else {
              deferred.resolve({
                name: res.name,
                email: res.email,
                uid: res.id,
                provider: "facebook",
                imageUrl: res.picture.data.url
              });
            }
          });
          return deferred.promise;
        }
        var loginSuccess = function (token) {
          fetchUserDetails().then(function (userDetails) {
            vm.token = token;
            getEventsByPageUserLiked();
          });
        }
        var popupLogin = function () {
          if (isSilent) {
            isSilent = false;
            return;
          }
          FB.login(function (response) {
            if (response.status === "connected") {
              loginSuccess(response.authResponse.accessToken);
            }
          }, { scope: scopes, auth_type: 'rerequest' });
        }

        FB.getLoginStatus(function (response) {
          if (response.status === "connected") {
            var requiredPermisions = scopes.split(',');
            var requireLogin = false;
            if (permisions && permisions.data) {
              requiredPermisions.forEach(function (rp) {
                if (_.find(permisions.data,
                  function (p) {
                    return p.permission === rp && p.status === "granted";
                  }) == null)
                  requireLogin = true;
              });
            }
            if (requireLogin)
              popupLogin();
            else
              loginSuccess(response.authResponse.accessToken);
          } else {
            popupLogin();
          }
        });
      }
    });
  }
}());
