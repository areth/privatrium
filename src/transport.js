const { EventEmitter } = require('events');

class Transport extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
  }

  deliverPackage(pack, peer) {
    // shout the lint up
    this.db = this.db;
  }
}

module.exports = Transport;
