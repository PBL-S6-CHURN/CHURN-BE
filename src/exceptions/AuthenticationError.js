const { ClientError } = require('./ClientError');

class AuthenticationError extends ClientError {
    constructor(message) {
        super(message, 401); // 401 untuk Unauthorized
        this.name = 'AuthenticationError';
    }
}

module.exports = { AuthenticationError };