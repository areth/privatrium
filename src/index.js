const { EventEmitter } = require('events');

class Node extends EventEmitter {
  constructor(_options) {
    super();
  }
}

module.exports = Node;
