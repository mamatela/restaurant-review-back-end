const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, colorize, uncolorize, splat, simple } = format;
const config = require('../../config');


const logger = createLogger({
  level: config.env === 'dev' ? 'debug' : 'info',
  format: combine(
    config.env === 'production' ? uncolorize() : colorize(),
    splat(),
    printf(({ timestamp, label, level, message }) => `${timestamp} [${label}] ${level}: ${message}`)
  ),
  transports: [
    // // - Write all logs with level `error` and below to `error.log`
    // new transports.File({ filename: 'error.log', level: 'error' }),
    // // - Write all logs with level `info` and below to `combined.log`
    // new transports.File({ filename: 'combined.log' }),

    new transports.Console({ format: simple(), silent: config.env == 'test' })
  ],
});


module.exports = logger;