const fileStorageFactory = require('../../src/storage/file');
const zlib = require('zlib');
const chai = require('chai');

const path = './test/storage/data.prt';
const password = 'JHGbkhFDg';
const data = { id: 'test id', text: 'lorem ipsum che to tam' };

chai.should();

describe('file storage', () => {
  describe('zlib', () => {
    it('zlib test', () => {
      const zipped = zlib.gzipSync(JSON.stringify(data));
      const zippedStr = zipped.toString('base64');
      const buffer = Buffer.from(zippedStr, 'base64');
      const unzipped = JSON.parse(zlib.gunzipSync(buffer));
      unzipped.should.deep.equal(data);
    });
  });

  describe('save', () => {
    it('it should save data', () =>
      fileStorageFactory(path, password).write(data));
  });

  describe('read', () => {
    it('it should read data', () =>
      fileStorageFactory(path, password).read()
        .then((restoredData) => {
          restoredData.should.deep.equal(data);
        }));
  });
});
