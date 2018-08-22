const messages = require('../src/messages');
const chai = require('chai');
const crypto = require('crypto');
const joi = require('joi');
const privateMessageSchema = require('../src/schemas/privateMessage');
const publicMessageSchema = require('../src/schemas/publicMessage');

const text = 'lorem ipsum che to tam';
const content = {
  date: Date.now(),
  text,
  key: 'some key',
};

const ecdh1 = crypto.createECDH(messages.ecdhCurve);
const ecdh2 = crypto.createECDH(messages.ecdhCurve);
ecdh1.generateKeys();
ecdh2.generateKeys();

chai.should();

describe('messages', () => {
  describe('hash', () => {
    it('it should make hash', () => {
      const hash = messages.hash(content);
      hash.should.be.a.string;
    });
  });

  describe('encode | decode', () => {
    it('it should encode | decode', () => {
      const encoded = messages.encode(
        content,
        ecdh1.getPrivateKey(messages.keysEncoding),
        ecdh2.getPublicKey(messages.keysEncoding)
      );
      encoded.should.be.a.string;
      const decoded = messages.decode(
        encoded,
        ecdh2.getPrivateKey(messages.keysEncoding),
        ecdh1.getPublicKey(messages.keysEncoding)
      );
      decoded.should.deep.equal(content);
    });
  });

  describe('make private message', () => {
    it('it should make private message', () => {
      const msg = messages.makePrivate(text);
      joi.assert(msg, privateMessageSchema);
    });
  });

  describe('make public message', () => {
    it('it should make public free message', () => {
      const msg = messages.makePrivate(text);
      const pubMsg = messages.makePublic(msg);
      joi.assert(pubMsg, publicMessageSchema);
    });

    it('it should make public encoded message', () => {
      const msgToReply = messages.makePrivate(text);
      const msg = messages.makePrivate(text, { replyToMessage: msgToReply });
      const pubMsg = messages.makePublic(msg);
      joi.assert(pubMsg, publicMessageSchema);
      pubMsg.content.should.be.a.string;
    });
  });
});
