const joi = require('joi');

module.exports = joi.object({
  id: joi.string().required(),
  queueSize: joi.object({
    messages: joi.number().integer().required(),
    replies: joi.number().integer().required(),
  }).required(),
  messages: joi.array().required(),
  replies: joi.array().required(),
  lastPacked: joi.date().timestamp().required(),
  timeoutHandler: joi.object(),
});
