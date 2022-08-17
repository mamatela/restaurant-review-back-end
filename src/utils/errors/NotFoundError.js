const ApiError = require('./ApiError');

class NotFoundError extends ApiError {
    constructor(message) {
        super(404, message);
    }
}

module.exports = NotFoundError;