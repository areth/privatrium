const { EventEmitter } = require('events');
const { gzip } = require('zlib');
const pify = require('pify');

const defaultOptions = {
  packageSize: 4 * 10 * 1024, // 40kb uncompressed => 10kb package
  repliesFactor: 0.5, // up 50% replies
  packTimeout: 3 * 60 * 1000, // 3 minutes
};

const makePeer = peer => ({
  id: peer,
  queueSize: { messages: 0, replies: 0 },
  messages: [],
  replies: [],
  lastPacked: 0,
});

const calcMessageSize = message => JSON.stringify(message).length;

class Dispatcher extends EventEmitter {
  constructor(db, options) {
    super();
    this.db = db;
    this.db.defaults({ peers: [] }).write();
    this.options = Object.assign({}, defaultOptions, options);
  }

  placeMessage(peer, message, relevance, queue = 'messages') {
    const entry = {
      id: message.id,
      message,
      relevance,
    };

    const queueData = this.getQueue(peer, queue);
    let dbObject;
    let messageSize;
    // check if message is in the queue
    const knownEntry = queueData.find({ id: entry.id }).value();
    if (knownEntry) {
      // message exists, update it
      dbObject = queueData.find({ id: entry.id }).assign(entry);
      // no messages size update, it has to be constant
      messageSize = 0;
    } else {
      // new message
      dbObject = queueData.push(entry);
      messageSize = calcMessageSize(message);
    }

    return dbObject.write()
      .then(() => {
        if (messageSize) {
          return this.getPeer(peer).get('queueSize')
            .update(queue, size => size + messageSize)
            .write();
        }
        return 0; // to shout the lint up
      })
      .then(() => this.checkPackageReady(peer));
  }

  placeReply(peer, reply, relevance) {
    return this.sendMessage(peer, reply, relevance, 'replies');
  }

  getQueue(peer, queue) {
    return this.getPeer(peer).get(queue);
  }

  getPeer(peer) {
    return this.db.get('peers').find({ id: peer });
  }

  removePeer(peer) {
    const peerData = this.getPeer(peer).value();
    if (peerData) {
      clearInterval(peerData.timeoutHandler);
    }

    return this.db.get('peers').remove({ id: peer }).write();
  }

  addPeer(peer) {
    const peerData = makePeer(peer);
    peerData.timeoutHandler = setInterval((peerId) => {
      this.checkPackageReady(peerId);
    }, this.options.packTimeout, peer);

    return this.db.get('peers')
      .push(peerData)
      .write();
  }

  checkPackageReady(peer) {
    const peerData = this.getPeer(peer).value();
    const totalSize = peerData.queueSize.messages + peerData.queueSize.replies;
    const elapsedTime = Date.now() - peerData.lastPacked;
    if ((totalSize >= this.options.packageSize)
      || (elapsedTime >= this.options.packTimeout && totalSize)) {
      this.emit('package:ready', peer);
    }
  }

  makePackage(peer) {
    const qSize = this.getPeer(peer).get('queueSize').value();
    const repliesSizeToPack = Math.min(
      this.options.packageSize * this.options.repliesFactor,
      qSize.replies
    );
    const messagesSizeToPack = this.options.packageSize - repliesSizeToPack;

    const pack = [];

    const messages = this.getQueue(peer, 'messages')
      .orderBy(['relevance'], ['desc']).value();
    let messagesPackedSize = 0;
    while (messages.length && messagesSizeToPack > messagesPackedSize) {
      const entry = messages.shift();
      pack.push(entry.message);
      messagesPackedSize += calcMessageSize(entry.message);
    }

    const replies = this.getQueue(peer, 'replies')
      .orderBy(['relevance'], ['desc']).value();
    let repliesPackedSize = 0;
    while (replies.length && repliesSizeToPack > repliesPackedSize) {
      const entry = replies.shift();
      pack.push(entry.message);
      repliesPackedSize += calcMessageSize(entry.message);
    }

    const peerData = this.getPeer(peer).value();
    peerData.messages = messages;
    peerData.replies = replies;
    peerData.queueSize.messages = Math.max(peerData.queueSize.messages - messagesPackedSize, 0);
    peerData.queueSize.replies = Math.max(peerData.queueSize.replies - repliesPackedSize, 0);
    peerData.lastPacked = Date.now();

    return this.getPeer(peer)
      .assign(peerData)
      .write()
      .then(() => pify(gzip)(JSON.stringify(pack)));
  }
}

module.exports = Dispatcher;
