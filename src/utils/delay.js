module.exports = delay => function (value) {
  return new Promise(resolve => setTimeout(() => resolve(value), delay));
};
