const joi = require('joi');

const locationUpdate = joi.object({
  latitude: joi.string().required(),
  longitude: joi.string().required(),
  metadata: joi.object().required()
});

const tripTracker = joi.object({
  latitude: joi.string().required(),
  longitude: joi.string().required(),
  orderId: joi.string().required(),
  metadata: joi.object().required()
});

module.exports = {
  locationUpdate,
  tripTracker
};
