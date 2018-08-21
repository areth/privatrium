const FileAsync = require('./lowdb-adapter-file');
const { gzipSync, gunzipSync } = require('zlib');
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';

module.exports = (path, password) => {
  const cipher = crypto.createCipher(algorithm, password);
  const decipher = crypto.createDecipher(algorithm, password);
  const encrypt = buffer => Buffer.concat([cipher.update(buffer), cipher.final()]);
  const decrypt = buffer => Buffer.concat([decipher.update(buffer), decipher.final()]);

  return new FileAsync(path, {
    serialize: data => encrypt(gzipSync(JSON.stringify(data))),
    deserialize: data => JSON.parse(gunzipSync(decrypt(data))),
  });
};
