(function (app) {
  'use strict';

  app.registerModule('core', ['angular-loading-bar']);
  app.registerModule('core.routes', ['ui.router']);
  app.registerModule('core.admin', ['core']);
  app.registerModule('core.admin.routes', ['ui.router']);
}(ApplicationConfiguration));
