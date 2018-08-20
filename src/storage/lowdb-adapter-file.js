const fs = require('graceful-fs');
const pify = require('pify');
const steno = require('steno');

const readFile = pify(fs.readFile);
const writeFile = pify(steno.writeFile);
const stringify = obj => JSON.stringify(obj, null, 2);

class FileAsync {
  constructor(
    source,
    { defaultValue = {}, serialize = stringify, deserialize = JSON.parse } = {}
  ) {
    this.source = source;
    this.defaultValue = defaultValue;
    this.serialize = serialize;
    this.deserialize = deserialize;
  }

  read() {
    // fs.exists is deprecated but not fs.existsSync
    if (fs.existsSync(this.source)) {
      // Read database
      return readFile(this.source)
        .then(data => (data ? this.deserialize(data) : this.defaultValue))
        .catch((e) => {
          if (e instanceof SyntaxError) {
            e.message = `Malformed JSON in file: ${this.source}\n${e.message}`;
          }
          throw e;
        });
    }
    // Initialize
    return writeFile(this.source, this.serialize(this.defaultValue)).then(() => this.defaultValue);
  }

  write(data) {
    return writeFile(this.source, this.serialize(data));
  }
}

module.exports = FileAsync;
