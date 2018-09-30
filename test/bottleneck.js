const BottleneckClass = require('../src/bottleneck');
const chai = require('chai');
const delay = require('../src/utils/delay');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
chai.should();

const messages = [];

describe('bottleneck', () => {
  before(() => {
    for (let i = 0; i < 1000; i += 1) {
      messages.push({ id: i, timestamp: Math.random() });
    }
  });

  describe('throttling', () => {
    it('it should send 50 msgs per 2 sec', () => {
      const bottleneck = new BottleneckClass({ limit: 50, interval: 2 * 1000, fill: false });

      let calls = 0;
      let prevMsg;
      let prevTimestamp;
      bottleneck.on('message', (msg) => {
        calls += 1;
        if (prevMsg) {
          // check messages order
          msg.timestamp.should.be.lte(prevMsg.timestamp); // lte = <=
          const interval = Date.now() - prevTimestamp;
          // check interval from prev message, must be at least messageInterval,
          // but not so large
          interval.should.be.within(bottleneck.messageInterval, bottleneck.messageInterval + 100);
        }
        prevMsg = msg;
        prevTimestamp = Date.now();
      });

      bottleneck.start();
      messages.forEach((msg) => {
        bottleneck.post(msg, msg.timestamp);
      });
      return delay(1 * 1000)() // wait for the half of period of 2 sec
        .then(() => {
          bottleneck.stop();
          calls.should.be.within(22, 24); // async calls number within fixed period may vary
        });
    });

    it('it should send nothing more than 2 messages', () => {
      const bottleneck = new BottleneckClass({ limit: 500, interval: 2 * 1000, fill: false });
      const spy = sinon.spy();
      bottleneck.on('message', spy);
      bottleneck.start();
      for (let i = 0; i < 2; i += 1) {
        bottleneck.post(messages[i], messages[i].timestamp);
      }
      return delay(0.1 * 1000)()
        .then(() => {
          bottleneck.stop();
          spy.should.have.callCount(2);
        });
    });

    it('it should send nothing', () => {
      const bottleneck = new BottleneckClass({ limit: 500, interval: 2 * 1000, fill: false });
      const spy = sinon.spy();
      bottleneck.on('message', spy);
      bottleneck.start();
      return delay(0.1 * 1000)()
        .then(() => {
          bottleneck.stop();
          spy.should.have.not.been.called;
        });
    });
  });
});
