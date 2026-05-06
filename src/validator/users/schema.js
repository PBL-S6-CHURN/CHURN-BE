const Joi = require('joi');

const UserPayloadSchema = {
    register: Joi.object({
        username: Joi.string().min(3).max(30).required().messages({
            'string.min': 'username minimal 3 karakter',
            'string.max': 'username maksimal 30 karakter',
            'string.empty': 'username tidak boleh kosong',
            'any.required': 'username harus diisi'
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'email tidak valid',
            'string.empty': 'email tidak boleh kosong',
            'any.required': 'email harus diisi'
        }),
        password: Joi.string().required().messages({
            'string.empty': 'password tidak boleh kosong',
            'any.required': 'password harus diisi'
        })
    }),

    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'email tidak valid',
            'string.empty': 'email tidak boleh kosong',
            'any.required': 'email harus diisi'
        }),
        password: Joi.string().required().messages({
            'string.empty': 'password tidak boleh kosong',
            'any.required': 'password harus diisi'
        })
    }),
}

module.exports = { UserPayloadSchema };