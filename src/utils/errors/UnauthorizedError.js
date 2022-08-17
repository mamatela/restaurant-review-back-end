const ApiError = require('./ApiError');

class UnauthorizedError extends ApiError {
    constructor(message) {
        super(401, message);
    }
}

module.exports = UnauthorizedError;