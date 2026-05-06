const { InvariantError } = require('../../exceptions/InvariantError');
const { UserPayloadSchema } = require('./schema');

const UserValidator = {
    validateRegisterPayload: (payload) => {
        const validationResult = UserPayloadSchema.register.validate(payload);

        if (validationResult.error) {
            throw new InvariantError(validationResult.error.details[0].message);
        }
    },
    validateLoginPayload: (payload) => {
        const validationResult = UserPayloadSchema.login.validate(payload);

        if (validationResult.error) {
            throw new InvariantError(validationResult.error.details[0].message);
        }
    }
};

module.exports = { UserValidator };