const OpenApiValidator = require('express-openapi-validator');
const path = require('path');
const bearerAuthSecurityHandler = require('./bearerAuth-security-handler');
const config = require('../../config');

let pathToOasYaml = path.join(__dirname, '../documentation/oas.yaml');

module.exports = OpenApiValidator.middleware({
  apiSpec: pathToOasYaml,
  validateRequests: {
    allowUnknownQueryParameters: false,
    removeAdditional: false
  },
  validateResponses: {
    removeAdditional: 'failing',
    coerceTypes: true
  },
  validateSecurity: {
    handlers: {
      bearerAuth: bearerAuthSecurityHandler
    }
  },
  operationHandlers: path.join(__dirname, '../operation-handlers'),
  fileUploader: {
    dest: `static/${config.staticImagesPath}/`,
  },
});