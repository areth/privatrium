const { EventEmitter } = require('events');
const lowdb = require('lowdb');
const messages = require('./messages');
const threads = require('./threads');

class Node extends EventEmitter {
  constructor(storage) {
    super();
    this.db = lowdb(storage);
  }

  postText(text, { replyTo = '', channel = '' } = {}) {
    const options = { channel };
    let replyToMessage;
    let thread;
    if (replyTo) {
      replyToMessage = this.findIncomeMessage(replyTo);
      if (!replyToMessage) {
        return Promise.reject(new Error(`Reply to unknown message ${replyTo}`));
      }
      options.replyToMessage = replyToMessage;

      if (replyToMessage.thread) {
        thread = this.findThread(replyToMessage.thread);
        if (thread) {
          options.thread = thread;
        }
      }
    }

    const message = messages.makePrivate(text, options);

    if (replyToMessage && !thread) {
      thread = threads.make(
        replyToMessage,
        message,
        { privateKey: message.keys, publicKey: replyToMessage.publicKey }
      );
      this.db.get('threads').push(thread);
      message.thread = thread.id;
    }

    // post message and return message id
    return this.post(message)
      .then(() => message.id);
  }

  post(message) {
    if (message.replyTo) {
      this.db.get('replies').push(message);
    } else {
      this.db.get('messages').push(message);
    }
    this.db.get('messagesIds').push(message.id);
    return this.db.write();
  }

  findIncomeMessage(messageId) {
    let message = this.db.get('income.messages')
      .find({ id: messageId })
      .value();
    if (!message) {
      message = this.db.get('income.replies')
        .find({ id: messageId })
        .value();
    }
    return message;
  }

  findOutcomeMessage(messageId) {
    let message = this.db.get('messages')
      .find({ id: messageId })
      .value();
    if (!message) {
      message = this.db.get('replies')
        .find({ id: messageId })
        .value();
    }
    return message;
  }

  findThread(threadId) {
    return this.db.get('threads')
      .find({ id: threadId })
      .value();
  }
}

module.exports = Node;
