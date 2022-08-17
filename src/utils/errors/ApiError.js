class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.type = 'ApiError';
        this.status = status;
    }
}

module.exports = ApiError;
