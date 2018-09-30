const DispatcherClass = require('../src/dispatcher');
const joi = require('joi');
const dispatcherPeerSchema = require('../src/schemas/dispatcherPeer');
const chai = require('chai');
const lowdb = require('lowdb');
const Memory = require('../src/storage/lowdb-adapter-memory');
const messages = require('../src/messages');
const { gunzip } = require('zlib');
const pify = require('pify');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const delay = require('../src/utils/delay');
// const fs = require('fs');

chai.use(sinonChai);
chai.should();

const peer1 = 'peerId1';
const peer2 = 'peerId2';
const peer3 = 'peerId3';

const msg1 = messages.makePublic(messages.makePrivate('Message 1 text'));
const msg2 = messages.makePublic(messages.makePrivate('Message 2 text'));

let dispatcher;
lowdb(new Memory())
  .then((db) => {
    dispatcher = new DispatcherClass(db, { packInterval: 0 });
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
      dispatcher.placeMessage(peer1, msg1, msg1.content.date));
    it('it should place message', () =>
      dispatcher.placeMessage(peer1, msg2, msg2.content.date));
    it('it should place message', () =>
      dispatcher.placeMessage(peer2, msg2, msg2.content.date));
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
          // msg1 should be the last due to relevance
          pack[1].should.deep.equal(msg1);
        }));
  });

  describe('package ready event', () => {
    let packTimeoutDefault;

    before(() => {
      packTimeoutDefault = dispatcher.options.packTimeout;
    });

    after(() => {
      dispatcher.options.packTimeout = packTimeoutDefault;
    });

    it('it shouldn`t fire package ready event by timeout', () => {
      const spy = sinon.spy();

      // extend the pack timeout to not fire unexpectedly
      dispatcher.options.packTimeout = 5000; // 5 seconds
      dispatcher.on('package:ready', spy);

      const msg = messages.makePublic(messages.makePrivate(`Some message text at ${Date.now()}`));

      return delay(dispatcher.options.packTimeout / 4)()
        .then(() => dispatcher.placeMessage(peer1, msg, msg.content.date))
        .then(() => spy.should.not.have.been.called);
    });

    it('it should fire package ready event by timeout', () => {
      const spy = sinon.spy();

      // shrink the pack timeout to not wait too long
      dispatcher.options.packTimeout = 1000; // 1 second
      dispatcher.on('package:ready', spy);

      const msg = messages.makePublic(messages.makePrivate(`Some message text at ${Date.now()}`));

      return delay(dispatcher.options.packTimeout)()
        .then(() => dispatcher.placeMessage(peer1, msg, msg.content.date))
        .then(() => {
          spy.should.have.been.calledWith(peer1);
        });
    });

    it('it should fire package ready event with queue gets full', () => {
      const spy = sinon.spy();

      // extend the pack timeout to not fire unexpectedly
      dispatcher.options.packTimeout = 5000; // 5 seconds
      dispatcher.on('package:ready', spy);

      let totalSize = 0;
      const placeMsgPrms = [];

      while (totalSize < dispatcher.options.packageSize) {
        const msg = messages.makePublic(messages.makePrivate(`Some message text at ${Date.now()}`));
        placeMsgPrms.push(dispatcher.placeMessage(peer1, msg, msg.content.date));
        totalSize += JSON.stringify(msg).length;
      }

      return Promise.all(placeMsgPrms)
        .then(() => {
          spy.should.have.been.calledWith(peer1);
        });
      // .then(() => dispatcher.makePackage(peer1))
      // .then(pack => console.log(pack.length));
      // .then(pack => pify(fs.writeFile)('./parcel', pack));
    });
  });

  describe('remove peer', () => {
    before(() => {
      dispatcher.addPeer(peer3);
    });

    it('it should remove peer', () => delay(500)()
      .then(() => dispatcher.removePeer(peer3)));
    it('it should remove peer', () => delay(500)()
      .then(() => dispatcher.removePeer(peer2)));
    it('it should remove peer', () => delay(500)()
      .then(() => dispatcher.removePeer(peer1)));
  });
});
