const joi = require('joi');

module.exports = joi.object({
  date: joi.date().timestamp().required(),
  text: joi.string().required(),
});
