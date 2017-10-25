'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Event Schema
 */
var EventSchema = new Schema({
  id: {
    type: String,
    unique: 'event already exists'
  },
  type: {
    type: String,
  },
  name: {
    type: String,
    default: '',
    required: 'Please fill Event name',
    trim: true
  },
  coverPicture: {
    type: String
  },
  profilePicture: {
    type: String
  },
  description: {
    type: String
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  timeFromNow: {
    type: String
  },
  category: {
    type: String
  },
  ticketing: {},
  place: {}
});

mongoose.model('Event', EventSchema);
