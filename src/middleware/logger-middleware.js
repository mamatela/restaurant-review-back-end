const morgan = require('morgan');
const logger = require('../utils/logger');
const config = require('../../config');

let format = config.env === 'production' ? 'combined' : 'dev';

let successLogger = morgan(format, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});


let errorLogger = morgan(format, {
  skip: (req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});

module.exports = {
  successLogger,
  errorLogger
}