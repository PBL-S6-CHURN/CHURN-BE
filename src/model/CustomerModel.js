'use strict';

const { query } = require("../config");
const { NotFoundError } = require("../exceptions/NotFoundError");
const { spawn } = require('child_process');
const path = require('path');

require('dotenv').config();

class CustomerModel {

    // root query
    static get #baseQuery() {
        return `
            SELECT
                cu.id,
                cu.customer_id, 
                p.plan_name, 
                co.contract_name,
                cu.monthly_revenue,
                cu.last_login_days_ago, 
                cu.feature_adoption_pct,
                cu.total_users, 
                cu.support_ticket_last_90d, 
                cu.tenure_months, 
                cu.monthly_usage_hrs, 
                cu.nps_score, 
                cu.payment_delay_count,
                p_pred.risk,         
                p_pred.score,        
                p_pred.risk_score,   
                p_pred.cause,        
                p_pred.solution     
            FROM customers cu 
            INNER JOIN plans p ON cu.plan_id = p.id 
            INNER JOIN contracts co ON cu.contract_id = co.id
            LEFT JOIN predicts p_pred ON cu.id = p_pred.customer_id
        `;
    };

    // get customer by string id
    static async GetCustomerByStringIdModel(customerIdString) {
        try {
            const textQuery = `SELECT id FROM customers WHERE customer_id = $1`;
            const result = await query(textQuery, [customerIdString]);
            return result.rows[0]; // Mengembalikan { id: <angka> } atau undefined jika tidak ketemu
        } catch (error) {
            console.log(`Error [GetCustomerByStringIdModel]: ${error.message}`);
            throw error;
        }
    }

    // show all customers without pagination
    static async GetAllCustomersModel() {
        try {
            // Mengambil seluruh data customer untuk di-loop oleh AI
            const textQuery = `SELECT * FROM customers ORDER BY id ASC`;
            const result = await query(textQuery);
            return result.rows;
        } catch (error) {
            console.error("Error [GetAllCustomersModel]:", error.message);
            throw error;
        }
    }

    // show all customers
    static async ShowAllCustomersModel(page=1, limit=10) {
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
    static async AddCustomerModel(customer_id, plan_id, contract_id, monthly_usage_hrs, feature_adoption_pct, payment_delay_count, support_ticket_last_90d, nps_score, tenure_months, last_login_days_ago, monthly_revenue, total_users) {
        try {
            const exist = await this.CheckCustomerIdExist(customer_id);
            if (exist) {
                throw new NotFoundError(`Customer with id ${customer_id} already exist`)
            };

            const textQuery = `INSERT INTO customers (customer_id, plan_id, contract_id, monthly_usage_hrs, feature_adoption_pct, payment_delay_count, support_ticket_last_90d, nps_score, tenure_months, last_login_days_ago, monthly_revenue, total_users) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
            const result = await query(textQuery, [customer_id, plan_id, contract_id, monthly_usage_hrs, feature_adoption_pct, payment_delay_count, support_ticket_last_90d, nps_score, tenure_months, last_login_days_ago, monthly_revenue, total_users]); 
            return result.rows[0];
        } catch (error) {
            console.log(`Error [AddCustomerModel]: ${error.message}`);
            throw error;
        }
    }

    // upload excell customer
    static async UploadExcellCustomerModel(datas) {
        try {
            const result = [];

            for (const data of datas) {
                const exist = await this.CheckCustomerIdExist(data.customer_id);
                if (exist) {
                    throw new NotFoundError(`Customer with id ${data.customer_id} already exist`)
                };
                
                const textQuery = `
                    INSERT INTO customers (customer_id, plan_id, contract_id, monthly_usage_hrs, feature_adoption_pct, payment_delay_count, support_ticket_last_90d, nps_score, tenure_months, last_login_days_ago, monthly_revenue, total_users) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING customer_id;
                `;
                const values = [
                    data.customer_id,
                    data.plan_id,
                    data.contract_id,
                    data.monthly_usage_hrs,
                    data.feature_adoption_pct,
                    data.payment_delay_count,
                    data.support_ticket_last_90d,
                    data.nps_score,
                    data.tenure_months,
                    data.last_login_days_ago,
                    data.monthly_revenue,
                    data.total_users
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
    static async FilterCustomerRiskModel(risk, page=1, limit=10) {
        try {
            const offset = (page - 1) * limit;
            const dataQuery = `
                ${this.#baseQuery} 
                WHERE p_pred.risk ILIKE $1 ORDER BY cu.customer_id ASC 
                LIMIT $2 OFFSET $3
            `;
            const countQuery = `SELECT COUNT(*) FROM customers cu LEFT JOIN predicts p_pred ON cu.id = p_pred.customer_id WHERE p_pred.risk ILIKE $1`;
            const [dataRes, countRes] = await Promise.all([
                query(dataQuery, [risk, limit, offset]),
                query(countQuery, [risk])
            ]);
            return {
                customers: dataRes.rows,
                totalData: parseInt(countRes.rows[0].count),
                totalPages: Math.ceil(countRes.rows[0].count / limit),
                currentPage: parseInt(page)
            };
        } catch (error) {
            console.error("Error [FilterCustomerRiskModel]:", error.message);
            throw error;
        }
    }
    // filter customer by type
    static async FilterCustomerTypeModel(type, page=1, limit=10) {
        try {
            const offset = (page - 1) * limit;
            const dataQuery = `
                ${this.#baseQuery} 
                WHERE p.plan_name ILIKE $1 ORDER BY cu.customer_id ASC 
                LIMIT $2 OFFSET $3
            `;
            const countQuery = `SELECT COUNT(*) FROM customers cu LEFT JOIN plans p ON cu.plan_id = p.id WHERE p.plan_name ILIKE $1`;
            const [dataRes, countRes] = await Promise.all([
                query(dataQuery, [type, limit, offset]),
                query(countQuery, [type])
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
    static async SearchCustomerbyCustomerIdModel(cId, page=1, limit=10) {
        try {
            const offset = (page - 1) * limit;
            const searchPattern = `%${cId}%`;
        
            // Query untuk ambil data dengan LIMIT dan OFFSET
            const dataQuery = `
                ${this.#baseQuery} 
                WHERE cu.customer_id ILIKE $1 ORDER BY cu.customer_id ASC 
                LIMIT $2 OFFSET $3
            `;
            
            // Query untuk hitung total record (penting untuk pagination)
            const countQuery = `SELECT COUNT(*) FROM customers cu WHERE cu.customer_id ILIKE $1`;
    
            const [dataRes, countRes] = await Promise.all([
                query(dataQuery, [searchPattern,limit, offset]),
                query(countQuery, [searchPattern])
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
        const textQuery = `
            SELECT 
                p.plan_name, 
                COUNT(c.id) AS total_count,
                ROUND(
                    (COUNT(c.id) * 100.0 / (SELECT COUNT(*) FROM customers)), 
                    2
                ) AS percentage
            FROM customers c
            JOIN plans p ON c.plan_id = p.id
            GROUP BY p.plan_name
            ORDER BY total_count DESC;
        `;

        try {
            const result = await query(textQuery);
            return result.rows;
        } catch (error) {
            console.log(`Error [StatsCustomerByTypeModel]: ${error.message}`);
        }
    }

    // stats customer by churn
    static async StatsCustomerByChurnModel() {
        try {
            const textQuery = `
                SELECT 
                    COUNT(CASE WHEN pr.score = 1 THEN 1 END) AS total_churn,
                    COUNT(CASE WHEN pr.score = 0 THEN 1 END) AS total_not_churn,
                    COUNT(cu.id) AS total_customer
                FROM customers cu
                LEFT JOIN predicts pr ON cu.id = pr.customer_id
            `;
            
            const result = await query(textQuery);
            const stats = result.rows[0];
    
            // Konversi string count dari PostgreSQL ke tipe data Number/Integer
            const totalChurn = parseInt(stats.total_churn) || 0;
            const totalNotChurn = parseInt(stats.total_not_churn) || 0;
            const totalCustomer = parseInt(stats.total_customer) || 0;
    
            // Hitung persentase secara aman (menghindari pembagian dengan angka 0)
            const churnPercentage = totalCustomer > 0 ? parseFloat(((totalChurn / totalCustomer) * 100).toFixed(2)) : 0;
            const notChurnPercentage = totalCustomer > 0 ? parseFloat(((totalNotChurn / totalCustomer) * 100).toFixed(2)) : 0;
    
            return {
                total_customer: totalCustomer,
                summary: {
                    churn: totalChurn,
                    not_churn: totalNotChurn
                },
                percentage: {
                    churn: `${churnPercentage}%`,
                    not_churn: `${notChurnPercentage}%`
                }
            };
        } catch (error) {
            console.error("Error [GetChurnStatisticsModel]:", error.message);
            throw error;
        }
    }

    // stats customer by risk
    static async GetStatsByRiskModel() {
        try {
            // Melakukan grouping berdasarkan kolom risk di tabel predicts
            const textQuery = `
                SELECT 
                    COALESCE(p_pred.risk, 'UNKNOWN') as risk_level,
                    COUNT(cu.id)::int as total_customer
                FROM customers cu
                LEFT JOIN predicts p_pred ON cu.id = p_pred.customer_id
                GROUP BY p_pred.risk
            `;
            const result = await query(textQuery);
            return result.rows;
        } catch (error) {
            console.error("Error [GetStatsByRiskModel]:", error.message);
            throw error;
        }
    }

    // Predict Manual
    static async PredictManualModel(inputData) {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const path = require('path');
            
            const scriptPath = path.join(__dirname, '../../ml_models/churn_prediction/predict.py');
            const pythonProcess = spawn('python', [scriptPath]);

            let output = "";
            let errorOutput = "";

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            // Kirim data JSON ke Python
            pythonProcess.stdin.write(JSON.stringify(inputData));
            pythonProcess.stdin.end();

            pythonProcess.on('close', (code) => {
                const cleanOutput = output.trim();
                const cleanError = errorOutput.trim();

                if (cleanOutput) {
                    try {
                        const parsedData = JSON.parse(cleanOutput);
                        return resolve(parsedData); // Mengembalikan objek JSON sukses/error buatan python
                    } catch (e) {
                        return reject(new Error(`Python mengembalikan teks non-JSON: ${cleanOutput}`));
                    }
                }
                
                // Jika masih kosong melompong (crash level Windows/Environment)
                reject(new Error(`Python Crash seketika (Code ${code}). Log Windows: ${cleanError || 'Library pandas/joblib belum terinstal di terminal Windows Anda. Silakan jalankan: pip install pandas joblib scikit-learn'}`));
            });
        });
    }

    // check Customer
    static async CheckCustomerIdExist(customer_id) {
        try {
            const textQuery = `
                SELECT 1 FROM customers WHERE customer_id = $1
            `;
            const result = await query(textQuery, [customer_id]);
            return result.rows[0];
        } catch (error) {
            console.error("Error [CheckCustomerIdExist]:", error.message);
            throw error;
        }
    }
}

module.exports = { CustomerModel };