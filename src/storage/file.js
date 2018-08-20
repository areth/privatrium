const FileAsync = require('./lowdb-adapter-file');
const { gzipSync, gunzipSync } = require('zlib');
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';

module.exports = (path, password) => {
  const cipher = crypto.createCipher(algorithm, password);
  const decipher = crypto.createDecipher(algorithm, password);

  function encrypt(buffer) {
    const crypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return crypted;
  }

  function decrypt(buffer) {
    const dec = Buffer.concat([decipher.update(buffer), decipher.final()]);
    return dec;
  }

  return new FileAsync(path, {
    serialize: data => encrypt(gzipSync(JSON.stringify(data))),
    deserialize: data => JSON.parse(gunzipSync(decrypt(data))),
  });
};
