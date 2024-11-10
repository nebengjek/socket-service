const joi = require('joi');

const connections = joi.object({
  event: joi.object().required(),
  userId: joi.string().required()
});

const historyCorporates = joi.object({
  corporateId: joi.string().required()
});

const notifCorporates = joi.object({
  userId: joi.string().required(),
  corporateId: joi.string().required()
});

module.exports = {
  connections,
  historyCorporates,
  notifCorporates
};
