const { InvariantError } = require('../../exceptions/InvariantError');
const { CustomerPayloadSchema} = require('./schema');

const CustomerValidator = {
    validateAddPayload: (payload) => {
        const validationResult = CustomerPayloadSchema.addCustomer.validate(payload);

        if (validationResult.error) {
            throw new InvariantError(validationResult.error.details[0].message);
        }
    },
    validateSearchPayload: (payload) => {
        const validationResult = CustomerPayloadSchema.searchCustomer.validate(payload);

        if (validationResult.error) {
            throw new InvariantError(validationResult.error.details[0].message);
        }
    }
};

module.exports = { CustomerValidator };