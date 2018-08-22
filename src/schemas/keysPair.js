const joi = require('joi');

module.exports = joi.object({
  privateKey: joi.string().required(),
  publicKey: joi.string().required(),
});
