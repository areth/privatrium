const { EventEmitter } = require('events');

class Node extends EventEmitter {
  constructor(storageAdapter) {
    super();
  }
}

module.exports = Node;
