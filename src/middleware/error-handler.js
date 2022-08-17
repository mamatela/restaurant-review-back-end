const httpStatus = require('http-status');
const config = require('../../config');
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
    /*
     * Excerpt from http://expressjs.com/en/guide/error-handling.html:
     * If you call next() with an error after you have started writing the response 
     * (for example, if you encounter an error while streaming the response to the client),
     * the Express default error handler closes the connection and fails the request.
     * So when you add a custom error handler, you must delegate to the default Express error handler,
     * when the headers have already been sent to the client:
     */
    if (res.headersSent) {
        return next(err)
    }

    /*
    * Build and send response
    * Bad Request errors thrown by the express-openapi-validator also come with .status property.
    */
    let code = err.status || 500;
    let message = err.message || httpStatus[code];

    // Don't leak 500s in production
    if (config.env === 'production' && code == 500) message = httpStatus[code];
    
    // Log errors
    logger.error(err.stack);

    // Send
    res.status(code).send({
        code,
        message
    });
    
    
    // (Temporarily) delegate to default express error-handler:
    // next(err);
}