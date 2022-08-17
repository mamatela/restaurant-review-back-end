const ahw = require('../utils/async-handler-wrapper');

const lib = {};

lib.ping = ahw(async (req, res, next) => {
  res.send('pong');
});

module.exports = lib;