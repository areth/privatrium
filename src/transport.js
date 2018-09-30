const { EventEmitter } = require('events');
const libp2p = require('libp2p');
const TCP = require('libp2p-tcp');
const SPDY = require('libp2p-spdy');
const SECIO = require('libp2p-secio');
const PeerInfo = require('peer-info');
const waterfall = require('async/waterfall');
const pify = require('pify');

class MyBundle extends libp2p {
  constructor(_options) {
    const defaults = {
      modules: {
        transport: [TCP],
        streamMuxer: [SPDY],
        connEncryption: [SECIO],
      },
    };

    super(Object.assign({}, defaults, _options));
  }
}

class Transport extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
    this.peers = new Map();
    waterfall([
      cb => PeerInfo.create(cb),
      (peerInfo, cb) => {
        peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0');
        this.node = new MyBundle({
          peerInfo,
        });
        this.node.start(cb);
      },
    ], err => callback(err, node));
  }

  connect(peer) {
    return pify(this.node.dialProtocol)(node2.peerInfo, '/a-protocol')
      .then((err, conn) => {
        if (err) { throw err; }
        this.peers.set(peer, conn);
      });
  }

  disconnect(peer) {
    // return pify(this.node.dialProtocol)(node2.peerInfo, '/a-protocol')
    //   .then((err, conn) => {
    //     if (err) { throw err }
    //     this.peers.set(peer, conn);
    //   });
  }

  sendPackage(peer, pack) {
    // if(this.peers)
  }

  assertPeerConnected(peer) {
    // if(!this.peers.has(peer))
  }
}

module.exports = Transport;
