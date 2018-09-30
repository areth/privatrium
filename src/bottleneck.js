const { EventEmitter } = require('events');
const assert = require('assert');

const defaultOptions = {
  limit: 400, // 400 messages
  interval: 60 * 1000, // 1 minute
  fill: true, // do fill before send first message
};

class Bottleneck extends EventEmitter {
  constructor(options) {
    super();
    this.options = Object.assign({}, defaultOptions, options);
    assert.ok(this.options.limit > 0);
    this.messageInterval = this.options.interval / this.options.limit;
    if (!this.options.queueSize) {
      this.options.queueSize = this.options.limit;
    }
    this.map = new Map();
    this.sorted = [];
  }

  post(message, priority) {
    this.isSorted = false;
    this.map.set(message, priority);
  }

  start() {
    this.started = true;
    if (this.options.fill) {
      // wait for full interval before the first transmit
      setTimeout(() => {
        this.step();
      }, this.options.interval);
    } else {
      this.step();
    }
  }

  stop() {
    this.started = false;
    clearTimeout(this.timeoutHandler);
  }

  step() {
    this.timeoutHandler = setTimeout(() => {
      this.extractTop();
      if (this.started) {
        this.step();
      }
    }, this.messageInterval);
  }

  extractTop() {
    const message = this.getSorted().shift();
    if (message) {
      this.map.delete(message[0]);
      this.emit('message', message[0]);
    }
  }

  getSorted() {
    if (!this.isSorted) {
      this.sorted = [...this.map.entries()].sort((a, b) => b[1] - a[1]);
      this.cutTail();
      this.isSorted = true;
    }
    return this.sorted;
  }

  cutTail() {
    const cutCount = this.sorted.length - this.options.queueSize;
    if (cutCount > 0) {
      const removed = this.sorted.splice(-cutCount, cutCount);
      removed.forEach((message) => {
        this.map.delete(message[0]);
      });
    }
  }
}

module.exports = Bottleneck;
