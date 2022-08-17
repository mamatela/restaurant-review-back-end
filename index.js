const app = require('./src/app');
const db = require('./src/db');
const logger = require('./src/utils/logger');

const config = require('./config');

db.init().then(() => {
  logger.info(`Conected to DB...`);
}).catch(unexpectedErrorHandler);

app.listen(config.port, () => {
  logger.info(`Listening on port ${config.port}...`);
});

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

function unexpectedErrorHandler(err) {
  logger.error(err.stack);
  logger.info('Exitting node...');
  app && app.close && app.close();
  process.exit(1);
}