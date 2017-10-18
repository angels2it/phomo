'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Event = mongoose.model('Event'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

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
  var type = 'places';
  if (req.query.type == 'pages')
    type = 'pages';
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

    // Instantiate EventSearch
    var es = type == 'places' ? new EventSearch() : new EventSearchByPages();

    // Search and handle results
    es.search(options).then(function (events) {
      res.json(events);
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
