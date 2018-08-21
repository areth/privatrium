const { EventEmitter } = require('events');
const lowdb = require('lowdb');
const messages = require('./messages');

class Node extends EventEmitter {
  constructor(storage) {
    super();
    this.db = lowdb(storage);
  }

  postText(text, { replyTo = '', channel = '' } = {}) {
    const message = messages.makePrivate(text, { channel });

    // post message and return message id
    return this.post(message)
      .then(() => message.id);
  }

  post(message) {
    if (!message.replyTo) {
      if (message.channel) {
        this.db.get('channels').push(message);
      } else {
        this.db.get('messages').push(message);
      }
    }
    this.db.get('messagesIds').push(message.id);
    return this.db.write();
  }
}

module.exports = Node;
