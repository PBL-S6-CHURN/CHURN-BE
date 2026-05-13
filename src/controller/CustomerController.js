"use strict";

const { ClientError } = require("../exceptions/ClientError");
const { CustomerPredict } = require("../helper/predict");
const { CustomerModel } = require("../model/CustomerModel");
const { CustomerValidator } = require("../validator/customers");
const xlsx = require('xlsx');

class CustomerController {
    static async CustomerGetController(req, res) {
        try {
            // ambil page defaultnya satu
            const { page = 1, limit = 5 } = req.query;

            const data = await CustomerModel.ShowAllCustomersModel(page, limit);
            const customers = data.customers;

            const resultPredict = await Promise.all(
                customers.map(customer => CustomerPredict(customer))
            );
            
            res.status(200).json({
                status: "success",
                metadata: {
                    total_data: data.totalData,
                    total_pages: data.totalPages,
                    current_page: data.currentPage,
                    page_size: limit
                },
                data: resultPredict
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: "error",
                message: error.message,
            })
        }
    }

    static async CustomerDetailController(req, res) {
        try {
            const { id } = req.params;
            const data = await CustomerModel.ShowCustomerByIdModel(id);
            res.status(200).json({
                status: "success",
                data: {
                    message: data,
                },
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: "error",
                message: error.message,
            })
        }
    }

    static async CustomerTypeController(req, res) {
        try {
            const { type } = req.params;
            const { page, limit } = req.query;

            const data = await CustomerModel.FilterCustomerTypeModel(type, page, limit);
            res.status(200).json({
                status: "success",
                metadata: {
                    total_data: data.totalData,
                    total_pages: data.totalPages,
                    current_page: data.currentPage,
                    page_size: limit
                },
                data: data.customers
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: "error",
                message: error.message,
            })
        }
    }

    static async CustomerSearchController(req, res) {
        try {
            CustomerValidator.validateSearchPayload(req.query);

            const { name, page = 1, limit = 5 } = req.query;

            const data = await CustomerModel.SearchCustomerbyCustomerIdModel(name, page, limit);
            res.status(200).json({
                status: "success",
                metadata: {
                    total_data: data.totalData,
                    total_pages: data.totalPages,
                    current_page: data.currentPage,
                    page_size: limit
                },
                data: data.customers
            });
        } catch (error) {
            // Cek apakah ini error yang kita buat sendiri (400/401)
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({
                    status: 'fail',
                    message: error.message,
                });
            }

            // Jika bukan (misal error database/server crash), kirim status 500
            console.error(error); // Tetap log untuk internal
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kegagalan pada server kami',
            });
        }
    }

    static async CustomerAddController(req, res) {
        try {
            CustomerValidator.validateAddPayload(req.body);
            const {customer_id, plan_id, contract_id, monthly_usage_hrs, feature_adoption_pct, payment_delay_count, support_ticket_count, nps_score, tenure_months, last_login_days_ago} = req.body;
            const data = await CustomerModel.AddCustomerModel(customer_id, plan_id, contract_id, monthly_usage_hrs, feature_adoption_pct, payment_delay_count, support_ticket_count, nps_score, tenure_months, last_login_days_ago);
            res.status(200).json({
                status: "success",
                data: {
                    message: data,
                },
            });
        } catch (error) {
            // Cek apakah ini error yang kita buat sendiri (400/401)
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({
                    status: 'fail',
                    message: error.message,
                });
            }

            // Jika bukan (misal error database/server crash), kirim status 500
            console.error(error); // Tetap log untuk internal
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kegagalan pada server kami',
            });
        }
    }

    static async CustomerUploadFile(req, res) {
        try {
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);

            const formattedData = data.map((row, index) => {
                // Mapping Plan Name ke ID
                let planId;
                const planName = row.plan_type ? row.plan_type.toLowerCase() : '';
                if (planName === 'starter') planId = 1;
                else if (planName === 'professional') planId = 2;
                else if (planName === 'enterprise') planId = 3;
                else throw new ClientError(`Baris ${index + 2}: Plan '${row.plan_type}' tidak dikenal`);

                // Mapping Contract Name ke ID
                let contractId;
                const contractName = row.contract_type ? row.contract_type.toLowerCase() : '';
                if (contractName === 'monthly') contractId = 1;
                else if (contractName === 'annual') contractId = 2;
                else throw new ClientError(`Baris ${index + 2}: Contract '${row.contract_type}' tidak dikenal`);

                // Sesuaikan nama kolom Excel dengan nama properti yang diharapkan Joi/Model
                return {
                    customer_id: row.customer_id,
                    plan_id: planId,
                    contract_id: contractId,
                    monthly_usage_hrs: parseFloat(row.monthly_usage_hrs),
                    feature_adoption_pct: parseFloat(row.feature_adoption_pct),
                    payment_delay_count: parseInt(row.payment_delay_count),
                    support_ticket_count: parseInt(row.support_tickets_count), // Perhatikan ada huruf 's' di file kamu
                    nps_score: parseInt(row.nps_score),
                    tenure_months: parseInt(row.tenure_months),
                    last_login_days_ago: parseInt(row.last_login_days_ago)
                };
            });

            formattedData.forEach((data, index) => {
                CustomerValidator.validateAddPayload(data);
            });

            const result = await CustomerModel.UploadExcellCustomerModel(formattedData);
            res.status(200).json({
                status: "success",
                data: {
                    message: `${result.length} data customer berhasil diimpor dari Excel`,
                },
            });
        } catch (error) {
            // Gunakan helper handleError yang sudah kita buat sebelumnya
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({ status: 'fail', message: error.message });
            }
            console.error(error);
            res.status(500).json({ status: 'error', message: 'Gagal memproses file excel' });
        }
    }

    static async StatsCustomerController(req, res) {
        try {
            const data = await CustomerModel.StatsCustomerByTypeModel();
            res.status(200).json({
                status: "success",
                data: {
                    message: data,
                },
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: "error",
                message: error.message,
            })
        }
    }

    // coba predict manual
    static async PredictManual(req, res) {
        try {
            const inputData = req.body;
            const data = await CustomerModel.PredictManualModel(inputData);

            res.status(200).json({
                status: "success",
                data: {
                    message: data,
                },
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: "error",
                message: error.message,
            })
        }
    }
}

module.exports = { CustomerController };