const fileStorageFactory = require('../../src/storage/file');
const chai = require('chai');

const path = './test/storage/data.prt';
const password = 'JHGbkhFDg';
const data = { id: 'test id', text: 'lorem ipsum che to tam' };

chai.should();

describe('file storage', () => {
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

    it('it should fail to decrypt data with wrong password', () =>
      fileStorageFactory(path, 'wrong password').read()
        .catch((err) => {
          err.should.exist;
        }));
  });
});
