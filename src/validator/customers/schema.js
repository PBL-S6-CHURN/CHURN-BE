const Joi = require('joi');

const CustomerPayloadSchema = {
    addCustomer: Joi.object({
        customer_id: Joi.string().required().messages({
            'string.empty': 'customer_id tidak boleh kosong',
            'any.required': 'customer_id harus diisi'
        }),
        plan_id: Joi.number().integer().required().messages({
            'string.empty': 'plan_id tidak boleh kosong',
            'any.required': 'plan_id harus diisi'
        }),
        contract_id: Joi.number().integer().required().messages({
            'string.empty': 'contract_id tidak boleh kosong',
            'any.required': 'contract_id harus diisi'
        }),
        monthly_revenue: Joi.number().required().messages({
            'string.empty': 'monthly_revenue tidak boleh kosong',
            'any.required': 'monthly_revenue harus diisi'
        }),
        last_login_days_ago: Joi.number().integer().required().messages({
            'string.empty': 'last_login_days_ago tidak boleh kosong',
            'any.required': 'last_login_days_ago harus diisi'
        }),
        feature_adoption_pct: Joi.number().required().messages({
            'string.empty': 'feature_adoption_pct tidak boleh kosong',
            'any.required': 'feature_adoption_pct harus diisi'
        }),
        support_ticket_last_90d: Joi.number().integer().required().messages({
            'string.empty': 'support_ticket_count tidak boleh kosong',
            'any.required': 'support_ticket_count harus diisi'
        }),
        tenure_months: Joi.number().required().messages({
            'string.empty': 'tenure_months tidak boleh kosong',
            'any.required': 'tenure_months harus diisi'
        }),
        monthly_usage_hrs: Joi.number().required().messages({
            'string.empty': 'monthly_usage_hrs tidak boleh kosong',
            'any.required': 'monthly_usage_hrs harus diisi'
        }),
        nps_score: Joi.number().integer().required().messages({
            'string.empty': 'nps_score tidak boleh kosong',
            'any.required': 'nps_score harus diisi'
        }),
        payment_delay_count: Joi.number().integer().required().messages({
            'string.empty': 'payment_delay_count tidak boleh kosong',
            'any.required': 'payment_delay_count harus diisi'
        }),
        total_users: Joi.number().integer().required().messages({
            'string.empty': 'total_users tidak boleh kosong',
            'any.required': 'total_users harus diisi'
        }),

    }),

    searchCustomer: Joi.object({
        customer_id: Joi.string().required().messages({
            'string.empty': 'customer_id tidak boleh kosong',
            'any.required': 'customer_id harus diisi'
        }),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).optional()
    }),
}

module.exports = { CustomerPayloadSchema };