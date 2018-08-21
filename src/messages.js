const crypto = require('crypto');
const bs58 = require('bs58');

const ecdhCurve = 'secp521r1';
const encodeAlgorithm = 'aes256';
const keysEncoding = 'base64';

const hash = (content) => {
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const hashFunction = Buffer.from('12', 'hex'); // 0x20
  const digest = crypto.createHash('sha256').update(contentStr).digest();
  const digestSize = Buffer.from(digest.byteLength.toString(16), 'hex');
  const combined = Buffer.concat([hashFunction, digestSize, digest]);
  const multihash = bs58.encode(combined);
  return multihash;
};

const encode = (content, privateKey, otherPublicKey) => {
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const ecdh = crypto.createECDH(ecdhCurve);
  ecdh.setPrivateKey(privateKey, keysEncoding);
  const secret = ecdh.computeSecret(otherPublicKey, keysEncoding);
  const cipher = crypto.createCipher(encodeAlgorithm, secret);
  let encrypted = cipher.update(contentStr, 'utf8', keysEncoding);
  encrypted += cipher.final(keysEncoding);
  return encrypted;
};

const decode = (encrypted, privateKey, otherPublicKey) => {
  const ecdh = crypto.createECDH(ecdhCurve);
  ecdh.setPrivateKey(privateKey, keysEncoding);
  const secret = ecdh.computeSecret(otherPublicKey, keysEncoding);
  const decipher = crypto.createDecipher(encodeAlgorithm, secret);
  let contentStr = decipher.update(encrypted, keysEncoding, 'utf8');
  contentStr += decipher.final('utf8');

  let content;
  try {
    content = JSON.parse(contentStr);
  } catch (e) {
    content = contentStr;
  }
  return content;
};

const makePrivate = (text, { replyToMessage = '', thread = '', channel = '' } = {}) => {
  const message = {
    content: {
      date: Date.now(),
      text,
    },
  };

  if (thread) {
    // if message is answer to the thread, it must be encoded
    message.publicKey = thread.publicKey;
    message.privateKey = thread.privateKey;
  } else {
    // messages beyond of the thread are open
    // generate key pair
    const ecdh = crypto.createECDH(ecdhCurve);
    ecdh.generateKeys();
    message.publicKey = ecdh.getPublicKey(keysEncoding);
    message.privateKey = ecdh.getPrivateKey(keysEncoding);
  }

  if (replyToMessage) {
    message.replyTo = replyToMessage.id;
    message.publicContent = encode(message.content, message.privateKey, replyToMessage.publicKey);
    message.id = hash(message.publicContent);
  } else {
    message.id = hash(message.content);
  }

  if (channel) {
    message.channel = channel;
  }

  return message;
};

const makePublic = (privateMessage) => {
  const message = {
    id: privateMessage.id,
    key: privateMessage.publicKey,
    content: privateMessage.replyTo ? privateMessage.publicContent : privateMessage.content,
  };

  if (privateMessage.replyTo) {
    message.replyTo = privateMessage.replyTo;
  }

  return message;
};

const makePrivateByIncome = (incomeMessage, replyToMessage = '') => {
  const message = {
    id: incomeMessage.id,
    publicKey: incomeMessage.key,
    content: replyToMessage
      ? decode(incomeMessage.content, replyToMessage.privateKey, incomeMessage.key)
      : incomeMessage.content,
  };

  if (incomeMessage.replyTo) {
    message.replyTo = incomeMessage.replyTo;
  }

  return message;
};

module.exports = {
  ecdhCurve,
  encodeAlgorithm,
  keysEncoding,
  makePrivate,
  makePublic,
  makePrivateByIncome,
  hash,
  encode,
  decode,
};
