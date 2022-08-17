const ApiError = require('./ApiError');

class BadRequestError extends ApiError {
    constructor(message) {
        super(400, message);
    }
}

module.exports = BadRequestError;