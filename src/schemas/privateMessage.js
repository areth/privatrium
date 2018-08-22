const joi = require('joi');
const messageContent = require('./messageContent');
const keysPair = require('./keysPair');

module.exports = joi.object({
  id: joi.string().required(),
  keys: keysPair.required(),
  publicContent: joi.string(),
  replyTo: joi.string(),
  channel: joi.string(),
  thread: joi.string(),
  content: messageContent.required(),
});
