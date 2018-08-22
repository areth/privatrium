const threads = require('../src/threads');
const messages = require('../src/messages');
const chai = require('chai');
const joi = require('joi');
const threadSchema = require('../src/schemas/thread');

const text = 'lorem ipsum che to tam';
const origMsg = messages.makePrivate(text);

const replyText = 'tra ta ta';
const replyMsg = messages.makePrivate(replyText, { replyToMessage: origMsg });

chai.should();

describe('threads', () => {
  describe('hash', () => {
    it('it should make hash', () => {
      const hash = threads.hash(origMsg.id, replyMsg.id);
      hash.should.be.a.string;
    });
  });

  describe('make thread', () => {
    it('it should make thread', () => {
      const thread = threads.make(origMsg, replyMsg, origMsg.keys);
      joi.assert(thread, threadSchema);
    });
  });
});
