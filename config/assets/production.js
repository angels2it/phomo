'use strict';

/* eslint comma-dangle:[0, "only-multiline"] */

module.exports = {
  client: {
    lib: {
      css: [
        // bower:css
        'public/lib/angular-ui-notification/dist/angular-ui-notification.min.css',
        'public/lib/bootstrap/dist/css/bootstrap.min.css',
        'public/lib/bootstrap/dist/css/bootstrap-theme.min.css',
        'public/lib/angular-loading-bar/build/loading-bar.min.css',
        // endbower
      ],
      js: [
        // bower:js
        '//connect.facebook.net/en_US/sdk.js',
        'public/lib/moment/min/moment.min.js',
        'public/lib/lodash/lodash.js',
        'public/lib/angular/angular.min.js',
        'public/lib/angular-animate/angular-animate.min.js',
        'public/lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
        'public/lib/angular-messages/angular-messages.min.js',
        'public/lib/angular-mocks/angular-mocks.js',
        'public/lib/angular-resource/angular-resource.min.js',
        'public/lib/angular-ui-notification/dist/angular-ui-notification.min.js',
        'public/lib/angular-ui-router/release/angular-ui-router.min.js',
        'public/lib/ng-file-upload/ng-file-upload.min.js',
        'public/lib/owasp-password-strength-test/owasp-password-strength-test.js',
        '//maps.google.com/maps/api/js?sensor=false&libraries=places&key=AIzaSyCewcYvjyUPTOGrH1pqnREGhea5ho2nTDs',
        'public/lib/ngmap/build/scripts/ng-map.min.js',
        'public/lib/angular-loading-bar/build/loading-bar.min.js',
        // endbower
      ]
    },
    css: 'public/dist/application*.min.css',
    js: 'public/dist/application*.min.js'
  }
};
