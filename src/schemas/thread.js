const joi = require('joi');
const keysPair = require('./keysPair');

module.exports = joi.object({
  id: joi.string().required(),
  origMessageId: joi.string().required(),
  replyMessageId: joi.string().required(),
  keys: keysPair.required(),
});
