module.exports = class MemoryAsync {
  constructor(
    source,
    {
      defaultValue = {},
      serialize = obj => JSON.stringify(obj, null, 2),
      deserialize = JSON.parse,
    } = {}
  ) {
    this.source = source;
    this.defaultValue = defaultValue;
    this.serialize = serialize;
    this.deserialize = deserialize;
  }

  read() {
    return Promise.resolve(this.defaultValue);
  }

  write() {
    return Promise.resolve(this);
  }
};
