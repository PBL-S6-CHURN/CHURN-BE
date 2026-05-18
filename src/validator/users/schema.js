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

    changePassword: Joi.object({
        oldPassword: Joi.string().required().messages({
            'string.empty': 'oldPassword tidak boleh kosong',
            'any.required': 'oldPassword harus diisi'
        }),
        newPassword: Joi.string().required().messages({
            'string.empty': 'newPassword tidak boleh kosong',
            'any.required': 'newPassword harus diisi'
        })
    }),

    updatedProfile: Joi.object({
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
        file: Joi.object({
            mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/jpg').required().messages({
                'any.only': 'Format file harus JPEG, JPG, atau PNG'
            }),
            size: Joi.number().max(2 * 1024 * 1024).required().messages({
                'string.empty': 'file tidak boleh kosong',
                'any.required': 'file harus diisi'
            })
        }).unknown(true).optional()
    })
}

module.exports = { UserPayloadSchema };