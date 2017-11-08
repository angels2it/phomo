'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Event = mongoose.model('Event'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash'),
  moment = require('moment');

// Own modules
var EventSearch = require("facebook-events-by-location-core");
var EventSearchByPages = require("../../../ait-facebook-events-by-page-core");

/**
 * Create a Event
 */
exports.create = function (req, res) {
  var event = new Event(req.body);
  event.user = req.user;

  event.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(event);
    }
  });
};

/**
 * Show the current Event
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  var event = req.event ? req.event.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  event.isCurrentUserOwner = req.user && event.user && event.user._id.toString() === req.user._id.toString();

  res.jsonp(event);
};

/**
 * Update a Event
 */
exports.update = function (req, res) {
  var event = req.event;

  event = _.extend(event, req.body);

  event.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(event);
    }
  });
};

/**
 * Delete an Event
 */
exports.delete = function (req, res) {
  var event = req.event;

  event.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(event);
    }
  });
};

/**
 * List of Events
 */
exports.list = function (req, res) {
  // Instantiate EventSearch
  var es = null;
  switch (req.query.type) {
    case "pages":
      es = new EventSearchByPages();
      break;
    case "public":
      Event.find({
        $and: [
          { startTime: { $gte: moment.unix(req.query.since).toDate().toISOString() } },
          { startTime: { $lte: moment.unix(req.query.until).toDate().toISOString() } }]
      }, function (err, events) {
        res.json(events);
      })
      return;
    default:
      es = new EventSearch();
      break;
  }
  if (!req.query.lat || !req.query.lng) {
    res.status(500).json({ message: "Please specify the lat and lng parameters!" });
  } else if (!req.query.accessToken && !process.env.FEBL_ACCESS_TOKEN) {
    res.status(500).json({ message: "Please specify an Access Token, either as environment variable or as accessToken parameter!" });
  } else {

    var options = {};

    // Add latitude
    if (req.query.lat) {
      options.lat = req.query.lat;
    }
    if (req.query.lng) {
      options.lng = req.query.lng;
    }
    if (req.query.distance) {
      options.distance = req.query.distance;
    }
    if (req.query.accessToken) {
      options.accessToken = req.query.accessToken;
    } else {
      options.accessToken = process.env.FEBL_ACCESS_TOKEN || null;
    }
    if (req.query.query) {
      options.query = req.query.query;
    }
    if (req.query.categories) {
      var categories = [];
      if (req.query.categories.length > 0) {
        if (req.query.categories.indexOf(",") > -1) {
          categories = req.query.categories.split(",");
        } else {
          categories.push(req.query.categories);
        }
      }
      options.categories = categories;
    }
    if (req.query.sort) {
      options.sort = req.query.sort;
    }
    if (req.query.version) {
      options.version = req.query.version;
    }
    if (req.query.since) {
      options.since = req.query.since;
    }
    if (req.query.until) {
      options.until = req.query.until;
    }
    // Search and handle results
    es.search(options).then(function (data) {
      res.json(data.events);
    }).catch(function (error) {
      res.status(500).json(error);
    });
  }


  // Event.find().sort('-created').populate('user', 'displayName').exec(function (err, events) {
  //   if (err) {
  //     return res.status(400).send({
  //       message: errorHandler.getErrorMessage(err)
  //     });
  //   } else {
  //     res.jsonp(events);
  //   }
  // });
};
exports.crawl = function (req, res) {
  console.log('start get events');
  var User = mongoose.model('User');
  User.find({ roles: 'admin' }, function (err, users) {
    if (err !== null)
      res.json('done');
    users.forEach(function (user) {
      console.log('get events by admin info - ' + user.displayName);
      var es = new EventSearchByPages();
      // Search and handle results
      es.search({
        accessToken: user.llAccessToken
      }).then(function (response) {
        if (response.events == null || response.events.length == 0) {
          res.json('done');
          return;
        }
        var Event = mongoose.model('Event');
        var time = 1;
        function checkSaveEvent() {
          if (time >= response.events.length)
            res.json('done');
          time++;
        }
        response.events.forEach(function (event) {
          Event.findOne({ id: event.id }, function (err, e) {
            if (e != null) {
              checkSaveEvent();
              return;
            }
            var sEvent = new Event(event);
            sEvent.save(function () {
              checkSaveEvent();
            });
          });
        }, this);
      }).catch(function (error) {
        console.log(error);
        res.json('done');
      });
    }, this);
  });
}
/**
 * Event middleware
 */
exports.eventByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Event is invalid'
    });
  }

  Event.findById(id).populate('user', 'displayName').exec(function (err, event) {
    if (err) {
      return next(err);
    } else if (!event) {
      return res.status(404).send({
        message: 'No Event with that identifier has been found'
      });
    }
    req.event = event;
    next();
  });
};
