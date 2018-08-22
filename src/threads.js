const crypto = require('crypto');

const hash = (origMessageId, replyMessageId) =>
  crypto.createHash('sha256').update(origMessageId + replyMessageId).digest('base64');

const make = (origMessage, replyMessage, keys) => {
  const thread = {
    id: hash(origMessage.id, replyMessage.id),
    origMessageId: origMessage.id,
    replyMessageId: replyMessage.id,
    keys,
  };

  return thread;
};

module.exports = {
  hash,
  make,
};
