'use strict';

const { query } = require("../config");
const { NotFoundError } = require("../exceptions/NotFoundError");

require('dotenv').config();

class CustomerModel {

    // root query
    static get #baseQuery() {
        return `
            SELECT 
                cu.customer_id, 
                p.plan_name, 
                co.contract_name, 
                cu.last_login_days_ago, 
                cu.feature_adoption_pct, 
                cu.support_ticket_count, 
                cu.tenure_months, 
                cu.monthly_usage_hrs, 
                cu.nps_score, 
                cu.payment_delay_count 
            FROM customers cu 
            INNER JOIN plans p ON cu.plan_id = p.id 
            INNER JOIN contracts co ON cu.contract_id = co.id
        `;
    };

    // show all customers
    static async ShowAllCustomersModel(page=1, limit=5) {
        try {
            const offset = (page - 1) * limit;
        
            // Query untuk ambil data dengan LIMIT dan OFFSET
            const dataQuery = `
                ${this.#baseQuery} 
                ORDER BY cu.customer_id ASC 
                LIMIT $1 OFFSET $2
            `;
            
            // Query untuk hitung total record (penting untuk pagination)
            const countQuery = `SELECT COUNT(*) FROM customers`;
    
            const [dataRes, countRes] = await Promise.all([
                query(dataQuery, [limit, offset]),
                query(countQuery)
            ]);
    
            return {
                customers: dataRes.rows,
                totalData: parseInt(countRes.rows[0].count),
                totalPages: Math.ceil(countRes.rows[0].count / limit),
                currentPage: parseInt(page)
            };
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            console.log(`Error [ShowAllCustomersModel]: ${error.message}`);
            
        }

    }

    // show customer by id
    static async ShowCustomerByIdModel(id) {
        const textQuery = `${this.#baseQuery} WHERE cu.id = $1`;
        try {
            const result = await query(textQuery, [id]);
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            console.log(`Error [ShowCustomerByIdModel]: ${error.message}`);
        }
    }

    // add customer
    static async AddCustomerModel(cId, planId, contractId, lastLoginDaysAgo, featureAdoptionPct, supportTicketCount, tenureMonths, monthlyUsageHrs, npsScore, paymentDelayCount) {
        try {
            const textQuery = `INSERT INTO customers (customer_id, plan_id, contract_id, last_login_days_ago, feature_adoption_pct, support_ticket_count, tenure_months, monthly_usage_hrs, nps_score, payment_delay_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
            const result = await query(textQuery, [cId, planId, contractId, lastLoginDaysAgo, featureAdoptionPct, supportTicketCount, tenureMonths, monthlyUsageHrs, npsScore, paymentDelayCount]); 
            return result.rows[0];
        } catch (error) {
            console.log(`Error [AddCustomerModel]: ${error.message}`);
        }
    }

    // upload excell customer
    static async UploadExcellCustomerModel(datas) {
        try {
            const result = [];

            for (const data of datas) {
                const textQuery = `
                    INSERT INTO customers (
                        customer_id, plan_id, contract_id, last_login_days_ago, 
                        feature_adoption_pct, support_ticket_count, tenure_months, 
                        monthly_usage_hrs, nps_score, payment_delay_count
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                    RETURNING customer_id;
                `;
                const values = [
                    data.customer_id,
                    data.plan_id,
                    data.contract_id,
                    data.last_login_days_ago,
                    data.feature_adoption_pct,
                    data.support_ticket_count,
                    data.tenure_months,
                    data.monthly_usage_hrs,
                    data.nps_score,
                    data.payment_delay_count
                ];
                const res = await query(textQuery, values);
                result.push(res.rows[0]); 
            }

            return result;
        } catch (error) {
            console.error("Error [BulkAddCustomerModel]:", error.message);
            throw error;
        }   
    }

    // filter customer by risk
    // filter customer by type
    static async FilterCustomerTypeModel(type, page=1, limit=5) {
        try {
            const offset = (page - 1) * limit;
            const dataQuery = `
                ${this.#baseQuery} 
                WHERE p.plan_name ILIKE $1 ORDER BY cu.customer_id ASC 
                LIMIT $2 OFFSET $3
            `;
            const countQuery = `SELECT COUNT(*) FROM customers`;
            const [dataRes, countRes] = await Promise.all([
                query(dataQuery, [type, limit, offset]),
                query(countQuery)
            ]);
            return {
                customers: dataRes.rows,
                totalData: parseInt(countRes.rows[0].count),
                totalPages: Math.ceil(countRes.rows[0].count / limit),
                currentPage: parseInt(page)
            };
        } catch (error) {
            console.error("Error [FilterCustomerTypeModel]:", error.message);
            throw error;
        }
    }

    // search customer by customer_id
    static async SearchCustomerbyCustomerIdModel(cId, page=1, limit=5) {
        try {
            const offset = (page - 1) * limit;
        
            // Query untuk ambil data dengan LIMIT dan OFFSET
            const dataQuery = `
                ${this.#baseQuery} 
                WHERE cu ILIKE $1 ORDER BY cu.customer_id ASC 
                LIMIT $2 OFFSET $3
            `;
            
            // Query untuk hitung total record (penting untuk pagination)
            const countQuery = `SELECT COUNT(*) FROM customers`;
    
            const [dataRes, countRes] = await Promise.all([
                query(dataQuery, [`%${cId}%`,limit, offset]),
                query(countQuery)
            ]);
    
            return {
                customers: dataRes.rows,
                totalData: parseInt(countRes.rows[0].count),
                totalPages: Math.ceil(countRes.rows[0].count / limit),
                currentPage: parseInt(page)
            };
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            console.log(`Error [SearchCustomerbyCustomerIdModel]: ${error.message}`);
        }
    }

    // stats customer by type
    static async StatsCustomerByTypeModel() {
        const textQuery = `SELECT 
                p.plan_name, 
                COUNT(cu.customer_id) AS total_customers
            FROM plans p
            LEFT JOIN customers cu ON p.id = cu.plan_id
            GROUP BY p.id, p.plan_name
            ORDER BY total_customers DESC;
        `;

        try {
            const result = await query(textQuery);
            return result.rows;
        } catch (error) {
            console.log(`Error [StatsCustomerByTypeModel]: ${error.message}`);
        }
    }
}

module.exports = { CustomerModel };