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
    },
    validateUpdateProfilePayload: (body, file) => {
        // Gabungkan body dan file menjadi satu objek agar bisa dibaca schema updatedProfile
        const dataToValidate = {
            username: body.username,
            email: body.email,
            file: file || undefined // Jika tidak ada file yang diupload, set jadi undefined supaya lolos aturan .optional()
        };

        const validationResult = UserPayloadSchema.updatedProfile.validate(dataToValidate);
        
        if (validationResult.error) {
            throw new ClientError(validationResult.error.message);
        }
    },
    validateChangePasswordPayload: (payload) => {
        const validationResult = UserPayloadSchema.changePassword.validate(payload);
        if (validationResult.error) {
            throw new ClientError(validationResult.error.message);
        }
    }
};

module.exports = { UserValidator };