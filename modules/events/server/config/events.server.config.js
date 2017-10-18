'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose');

var EventSearchByPages = require("../../../ait-facebook-events-by-page-core");

/**
 * Events module init function.
 */
module.exports = function (app, db) {
  config.agenda.define('get events by admin facebook authentication', function (job, done) {
    console.log('start get events...');
    var User = mongoose.model('User');
    User.find({ roles: 'admin' }, function (err, users) {
      if (err != null)
        done();
      users.forEach(function (user) {
        console.log('get events by admin info - ' + user.displayName);
        var es = new EventSearchByPages();
        // Search and handle results
        es.search({
          accessToken: user.llAccessToken
        }).then(function (response) {
          if (response.events == null || response.events.length == 0) {
            done();
            return;
          }
          var Event = mongoose.model('Event');
          response.events.forEach(function (event) {
            Event.findOne({ id: event.id }, function (err, e) {
              if (e != null)
                return;
              var sEvent = new Event(event);
              sEvent.save();
            });
          }, this);
          done();
        }).catch(function (error) {
          console.log(error);
          done();
        });
      }, this);
    });
  });
  config.agenda.on('ready', function () {
    // Alternatively, you could also do:
    config.agenda.every('1 hour', 'get events by admin facebook authentication');
  });
};
