'use strict';

// src/helpers/aiHelper.js
const { CustomerModel } = require("../model/CustomerModel");

const CustomerPredict = async (customerData) => {
    try {
        // Pastikan field yang dikirim sesuai dengan yang diminta skrip Python
        const ai = await CustomerModel.PredictManualModel({
            total_users: customerData.total_users,
            monthly_usage_hrs: customerData.monthly_usage_hrs,
            feature_adoption_pct: customerData.feature_adoption_pct,
            support_tickets_count: customerData.support_tickets_count,
            nps_score: customerData.nps_score,
            tenure_months: customerData.tenure_months,
            last_login_days_ago: customerData.last_login_days_ago
        });

        return {
            ...customerData,
            risk_score: ai.score,
            risk_level: ai.risk_level,
            churn_status: ai.churn_status
        };
    } catch (error) {
        console.error(`Helper AI Error for ${customerData.customer_name || 'Customer'}:`, error.message);
        // Return data asli dengan info error agar loop tidak berhenti
        return {
            ...customerData,
            risk_score: 0,
            risk_level: "Error",
            churn_status: "Unknown"
        };
    }
};

module.exports = { CustomerPredict };