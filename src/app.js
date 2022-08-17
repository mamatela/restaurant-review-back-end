const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const config = require('../config');
const rateLimiter = require('./middleware/rate-limiter');
const errorHandler = require('./middleware/error-handler');
const { successLogger, errorLogger } = require('./middleware/logger-middleware');
const { NotFoundError } = require('./utils/errors');
const openApiValidator = require('./middleware/openapi-validator');

let pathToOasYaml = path.join(__dirname, './documentation/oas.yaml');
let swaggerDocument = YAML.load(pathToOasYaml);

let app = express();

// load loggers unless its test env.
if (config.env !== 'test') {
  app.use(successLogger);
  app.use(errorLogger);
}

// Set security headers
app.use(helmet());

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Sanitize data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// Enable cors
app.use(cors());
app.options('*', cors());

// Limit repeated failed login attempts.
if (config.env === 'production') {
  app.use('/v1/auth', rateLimiter);
}

// Serve swagger (this must come before openapi-validator middleware)
app.use('/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Validate requests according to Open API 3.0 yaml specification
app.use(openApiValidator);
// Routes are loaded autoamtically by OpenApiValidator using information in OAS.

// Serve images
app.use(express.static('static'));

// Send back 404 for non-existing paths
app.use(() => { throw new NotFoundError('Path not found') });

// handle errors
app.use(errorHandler);

module.exports = app;