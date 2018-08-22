const joi = require('joi');
const messageContent = require('./messageContent');

module.exports = joi.object({
  id: joi.string().required(),
  key: joi.string().required(),
  replyTo: joi.string(),
  content: joi.alternatives().try(joi.string(), messageContent).required(),
});
