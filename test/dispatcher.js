const DispatcherClass = require('../src/dispatcher');
const joi = require('joi');
const dispatcherPeerSchema = require('../src/schemas/dispatcherPeer');
const chai = require('chai');
const lowdb = require('lowdb');
const Memory = require('../src/storage/lowdb-adapter-memory');
const messages = require('../src/messages');
const { gunzip } = require('zlib');
const pify = require('pify');

chai.should();

const peer1 = 'peerId1';
const peer2 = 'peerId2';

const msg1 = messages.makePublic(messages.makePrivate('Message 1 text'));
msg1.relevance = msg1.content.date;
const msg2 = messages.makePublic(messages.makePrivate('Message 2 text'));
msg2.relevance = msg2.content.date;

let dispatcher;
lowdb(new Memory())
  .then((db) => {
    dispatcher = new DispatcherClass(db, { packTimeout: 500 });
  });

describe('dispatcher', () => {
  describe('add peer', () => {
    it('it should add peer', () => {
      dispatcher.addPeer(peer1);
    });
    it('it should add peer', () => {
      dispatcher.addPeer(peer2);
    });
  });

  describe('get peer', () => {
    it('it should return peer data', () => {
      const peerData = dispatcher.getPeer(peer1).value();
      peerData.should.exist;
      joi.assert(peerData, dispatcherPeerSchema);
    });
  });

  describe('place message', () => {
    it('it should place message', () =>
      dispatcher.placeMessage(peer1, msg1));
    it('it should place message', () =>
      dispatcher.placeMessage(peer1, msg2));
    it('it should place message', () =>
      dispatcher.placeMessage(peer2, msg2));
  });

  describe('check package ready', () => {
    it('it should check package ready', () => {
      dispatcher.checkPackageReady(peer1);
    });
  });

  describe('make package', () => {
    it('it should make package', () =>
      dispatcher.makePackage(peer1)
        .then(pack => pify(gunzip)(pack))
        .then((json) => {
          const pack = JSON.parse(json);
          pack[1].should.deep.equal(msg1);
        }));
  });

  describe('remove peer', () => {
    it('it should remove peer', () => {
      setTimeout(() => {
        dispatcher.removePeer(peer1);
      }, 1500);
    });
    it('it should remove peer', () => {
      setTimeout(() => {
        dispatcher.removePeer(peer2);
      }, 1500);
    });
  });
});
