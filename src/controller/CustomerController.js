"use strict";

const { ClientError } = require("../exceptions/ClientError");
const { churnPredict } = require("../helper/churnPredict");
const { CustomerModel } = require("../model/CustomerModel");
const { PredictModel } = require("../model/PredictModel");
const { CustomerValidator } = require("../validator/customers");
const { AlertModel } = require("../model/AlertModel");
const xlsx = require("xlsx");

class CustomerController {

    static async CustomerGetController(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const data = await CustomerModel.ShowAllCustomersModel(page, limit);
            const customers = data.customers;

            const resultPredict = customers.map((customer) => {
                return {
                    id: customer.id,
                    customer_id: customer.customer_id,
                    plan_id: customer.plan_id,
                    contract_id: customer.contract_id,
                    plan_name: customer.plan_name,
                    contract_name: customer.contract_name,
                    last_login_days_ago: customer.last_login_days_ago,
                    monthly_revenue: customer.monthly_revenue,
                    feature_adoption_pct: customer.feature_adoption_pct,
                    total_users: customer.total_users,
                    support_ticket_last_90d: customer.support_ticket_last_90d,
                    tenure_months: customer.tenure_months,
                    monthly_usage_hrs: customer.monthly_usage_hrs,
                    nps_score: customer.nps_score,
                    payment_delay_count: customer.payment_delay_count,
                    created_at: customer.created_at,

                    prediction_results:
                        customer.score !== null && customer.score !== undefined
                            ? {
                                score: customer.score,
                                risk_score_pct: customer.risk_score,
                                platt_score_pct: customer.platt_score_pct ?? null,  // ← BARU
                                risk_level: customer.risk,
                                churn_status: customer.score === 1 ? "YES" : "NO",
                                churn_factors: customer.cause ? customer.cause.split("\n") : [],
                                solutions: customer.solution ? customer.solution.split("\n") : [],
                            }
                            : null,
                };
            });

            return res.status(200).json({
                status: "success",
                metadata: {
                    total_data: data.totalData,
                    total_pages: data.totalPages,
                    current_page: data.currentPage,
                    page_size: parseInt(limit),
                },
                data: resultPredict,
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    static async CustomerDetailController(req, res) {
        try {
            const { id } = req.params;
            const data = await CustomerModel.ShowCustomerByIdModel(id);
            res.status(200).json({ status: "success", data: { message: data } });
        } catch (error) {
            console.log(error);
            res.status(500).json({ status: "error", message: error.message });
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
                    page_size: limit,
                },
                data: data.customers,
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    static async CustomerSearchController(req, res) {
        try {
            CustomerValidator.validateSearchPayload(req.query);
            const { customer_id, page = 1, limit = 10 } = req.query;
            const data = await CustomerModel.SearchCustomerbyCustomerIdModel(customer_id, page, limit);
            res.status(200).json({
                status: "success",
                metadata: {
                    total_data: data.totalData,
                    total_pages: data.totalPages,
                    current_page: data.currentPage,
                    page_size: limit,
                },
                data: data.customers,
            });
        } catch (error) {
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({ status: "fail", message: error.message });
            }
            console.error(error);
            return res.status(500).json({ status: "error", message: "Terjadi kegagalan pada server kami" });
        }
    }

    static async CustomerAddController(req, res) {
        try {
            CustomerValidator.validateAddPayload(req.body);
            const {
                customer_id, plan_id, contract_id, monthly_usage_hrs,
                feature_adoption_pct, payment_delay_count, support_ticket_last_90d,
                nps_score, tenure_months, last_login_days_ago, monthly_revenue, total_users,
            } = req.body;

            const newCustomer = await CustomerModel.AddCustomerModel(
                customer_id, plan_id, contract_id, monthly_usage_hrs,
                feature_adoption_pct, payment_delay_count, support_ticket_last_90d,
                nps_score, tenure_months, last_login_days_ago, monthly_revenue, total_users
            );

            const fullCustomerData = await CustomerModel.ShowCustomerByIdModel(newCustomer.id);

            if (!fullCustomerData.plan_name) {
                const plans = { 1: "Starter", 2: "Professional", 3: "Enterprise" };
                fullCustomerData.plan_name = plans[plan_id] || "Starter";
            }
            if (!fullCustomerData.contract_name) {
                const contracts = { 1: "Monthly", 2: "Annual" };
                fullCustomerData.contract_name = contracts[contract_id] || "Monthly";
            }

            await CustomerController.#executeLivePrediction([fullCustomerData]);
            const finalData = await CustomerModel.ShowCustomerByIdModel(newCustomer.id);

            return res.status(200).json({
                status: "success",
                message: "Customer baru berhasil ditambahkan dan langsung diprediksi oleh AI.",
                data: finalData,
            });
        } catch (error) {
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({ status: "fail", message: error.message });
            }
            console.error(error);
            return res.status(500).json({ status: "error", message: "Terjadi kegagalan pada server kami" });
        }
    }

    static async CustomerUploadFile(req, res) {
        try {
            const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);

            const formattedData = data.map((row, index) => {
                let planId;
                const planName = row.plan_type ? row.plan_type.toLowerCase() : "";
                if (planName === "starter") planId = 1;
                else if (planName === "professional") planId = 2;
                else if (planName === "enterprise") planId = 3;
                else throw new ClientError(`Baris ${index + 2}: Plan '${row.plan_type}' tidak dikenal`);

                let contractId;
                const contractName = row.contract_type ? row.contract_type.toLowerCase() : "";
                if (contractName === "monthly") contractId = 1;
                else if (contractName === "annual") contractId = 2;
                else throw new ClientError(`Baris ${index + 2}: Contract '${row.contract_type}' tidak dikenal`);

                return {
                    customer_id: row.customer_id,
                    plan_id: planId,
                    contract_id: contractId,
                    monthly_usage_hrs: parseFloat(row.monthly_usage_hrs),
                    feature_adoption_pct: parseFloat(row.feature_adoption_pct),
                    payment_delay_count: parseInt(row.payment_delay_count),
                    support_ticket_last_90d: parseInt(row.support_ticket_last_90d),
                    nps_score: parseInt(row.nps_score),
                    tenure_months: parseInt(row.tenure_months),
                    last_login_days_ago: parseInt(row.last_login_days_ago),
                    monthly_revenue: parseFloat(row.monthly_revenue),
                    total_users: parseInt(row.total_users),
                };
            });

            formattedData.forEach((data) => { CustomerValidator.validateAddPayload(data); });

            const totalDataAwal = formattedData.length;
            const hasilInsert = await CustomerModel.UploadExcellCustomerModel(formattedData);
            const jumlahBerhasil = hasilInsert.length;
            const jumlahGagal = totalDataAwal - jumlahBerhasil;

            if (jumlahBerhasil === 0) {
                throw new ClientError("Tidak ada data customer yang berhasil diimpor.");
            }

            res.status(200).json({
                status: "success",
                message: "Data customer berhasil diimpor.",
                data: {
                    total_data_awal: totalDataAwal,
                    total_data_berhasil: jumlahBerhasil,
                    total_data_gagal: jumlahGagal,
                },
            });
        } catch (error) {
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({ status: "fail", message: error.message });
            }
            console.error(error);
            res.status(500).json({ status: "error", message: "Gagal memproses file excel" });
        }
    }

    static async StatsCustomerController(req, res) {
        try {
            const data = await CustomerModel.StatsCustomerByTypeModel();
            res.status(200).json({ status: "success", data: { message: data } });
        } catch (error) {
            console.log(error);
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    static async CustomerFilterbyRisk(req, res) {
        try {
            const { risk } = req.params;
            const { page, limit } = req.query;
            const data = await CustomerModel.FilterCustomerRiskModel(risk, page, limit);
            res.status(200).json({ status: "success", data: { message: data } });
        } catch (error) {
            console.log(error);
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    static async PredictManual(req, res) {
        try {
            const inputData = req.body;

            if (!inputData || Object.keys(inputData).length === 0) {
                return res.status(400).json({ status: "error", message: "Body request tidak boleh kosong" });
            }

            const customerIdString = inputData.customer_id;
            const result = await churnPredict(inputData);

            if (result.status === "success") {
                const customerDb = await CustomerModel.GetCustomerByStringIdModel(customerIdString);

                if (customerDb) {
                    console.log(`[INFO] Menyimpan ke tabel predicts untuk Customer ID: ${customerDb.customer_id}`);
                    await PredictModel.SaveOrUpdatePredict(
                        customerDb.id,
                        result.risk_level,
                        result.score,
                        result.risk_score_pct,
                        result.churn_factors,
                        result.solutions,
                        result.platt_score_pct ?? null   // ← BARU
                    );
                } else {
                    console.log(`[WARN] Customer dengan ID string ${inputData.customer_id} tidak ditemukan di DB.`);
                }

                return res.status(200).json({
                    status: "success",
                    message: "Prediksi berhasil dihitung oleh AI",
                    data: {
                        score: result.score,
                        risk_score_pct: result.risk_score_pct,
                        platt_score_pct: result.platt_score_pct ?? null,   // ← BARU
                        risk_level: result.risk_level,
                        churn_status: result.churn_status,
                        churn_factors: result.churn_factors,
                        solutions: result.solutions,
                    },
                });
            } else {
                return res.status(500).json({
                    status: "error",
                    message: result.message || "Gagal mengeksekusi prediksi model",
                    titik_gagal: result.titik_gagal,
                });
            }
        } catch (error) {
            console.error("Error pada fungsi predictManual:", error.message);
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    static async StatsCustomerChurnController(req, res) {
        try {
            const data = await CustomerModel.StatsCustomerByChurnModel();
            res.status(200).json({ status: "success", data: { message: data } });
        } catch (error) {
            console.log(error);
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    static async StatsCustomerRiskController(req, res) {
        try {
            const rawData = await CustomerModel.GetStatsByRiskModel();
            const summary = { low: 0, medium: 0, high: 0, unknown: 0 };
            let totalCustomer = 0;

            rawData.forEach(row => {
                const level = row.risk_level.toLowerCase();
                if (summary.hasOwnProperty(level)) {
                    summary[level] = row.total_customer;
                    totalCustomer += row.total_customer;
                }
            });

            const percentage = {
                low:     totalCustomer > 0 ? `${Math.round((summary.low     / totalCustomer) * 100)}%` : "0%",
                medium:  totalCustomer > 0 ? `${Math.round((summary.medium  / totalCustomer) * 100)}%` : "0%",
                high:    totalCustomer > 0 ? `${Math.round((summary.high    / totalCustomer) * 100)}%` : "0%",
                unknown: totalCustomer > 0 ? `${Math.round((summary.unknown / totalCustomer) * 100)}%` : "0%",
            };

            return res.status(200).json({
                status: "success",
                data: { total_customer: totalCustomer, summary, percentage },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    // ── CORE: Live prediction + simpan ke DB ────────────────────────────────────
    static async #executeLivePrediction(customers) {
        console.log(`[LIVE PREDICT] Memproses ${customers.length} data customer ke AI model...`);
        for (const customer of customers) {
            try {
                const planMap     = { 1: "Starter", 2: "Professional", 3: "Enterprise" };
                const contractMap = { 1: "Monthly",  2: "Annual" };

                const inputData = {
                    customer_id:              customer.customer_id,
                    monthly_usage_hrs:        parseFloat(customer.monthly_usage_hrs),
                    feature_adoption_pct:     parseFloat(customer.feature_adoption_pct),
                    support_tickets_last_90d: parseInt(customer.support_ticket_last_90d),
                    tenure_months:            parseInt(customer.tenure_months),
                    nps_score:                parseInt(customer.nps_score),
                    payment_delay_count:      parseInt(customer.payment_delay_count),
                    plan_type:                planMap[customer.plan_id],
                    contract_type:            contractMap[customer.contract_id],
                    monthly_revenue:          parseFloat(customer.monthly_revenue),
                    total_users:              parseInt(customer.total_users),
                    last_login_days_ago:      parseInt(customer.last_login_days_ago),
                };

                const result = await churnPredict(inputData);

                if (result.status === "success") {
                    // ── Simpan ke tabel predicts (7 argumen, tambah platt_score_pct) ──
                    await PredictModel.SaveOrUpdatePredict(
                        customer.id,
                        result.risk_level,
                        result.score,
                        result.risk_score_pct,
                        result.churn_factors,
                        result.solutions,
                        result.platt_score_pct ?? null   // ← BARU
                    );

                    if (result.risk_level === "HIGH") {
                        await AlertModel.CreateAlertIfNotExist(
                            customer.id,
                            'High Churn Risk',
                            'high',
                            `Customer ${customer.customer_id} terdeteksi oleh AI memiliki risiko Churn yang TINGGI (Skor Prediksi: ${result.risk_score_pct}).`,
                            { risk_score: result.risk_score_pct, factors: result.churn_factors }
                        );
                    }

                    if (parseInt(customer.nps_score) <= 3) {
                        await AlertModel.CreateAlertIfNotExist(
                            customer.id,
                            'Low NPS Score',
                            'medium',
                            `Customer ${customer.customer_id} memberikan nilai kepuasan (NPS) sangat rendah: ${customer.nps_score}.`,
                            { nps_score: customer.nps_score }
                        );
                    }

                    if (parseInt(customer.payment_delay_count) >= 4) {
                        await AlertModel.CreateAlertIfNotExist(
                            customer.id,
                            'Late Payment Warning',
                            'medium',
                            `Customer ${customer.customer_id} sudah mendapati record telat bayar sebanyak ${customer.payment_delay_count} kali.`,
                            { payment_delay_count: customer.payment_delay_count }
                        );
                    }
                }
            } catch (loopError) {
                console.error(`> Gagal memproses data live ${customer.customer_id}:`, loopError.message);
            }
        }
    }

    static async CustomerPredictStreamController(req, res) {
        try {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');

            console.log("[SSE] Koneksi dimulai. Menarik seluruh data customer...");

            const allCustomers = await CustomerModel.GetAllCustomersModel();
            const totalData = allCustomers.length;

            if (totalData === 0) {
                res.write(`data: ${JSON.stringify({ status: "empty", message: "Tidak ada data customer untuk diprediksi" })}\n\n`);
                res.write('data: [DONE]\n\n');
                return res.end();
            }

            for (let i = 0; i < totalData; i++) {
                const customer = allCustomers[i];
                const currentProgress = i + 1;
                const percentage = Math.round((currentProgress / totalData) * 100);

                try {
                    await CustomerController.#executeLivePrediction([customer]);

                    res.write(`data: ${JSON.stringify({
                        status: "processing",
                        current: currentProgress,
                        total: totalData,
                        percentage,
                        customer_code: customer.customer_id,
                        message: `Berhasil memproses ${customer.customer_id}`,
                    })}\n\n`);

                } catch (loopError) {
                    console.error(`[SSE Error] Gagal memproses customer ID ${customer.id}:`, loopError.message);
                    res.write(`data: ${JSON.stringify({
                        status: "error_item",
                        customer_code: customer.customer_id,
                        message: `Gagal memproses ${customer.customer_id}: ${loopError.message}`,
                    })}\n\n`);
                }
            }

            console.log("[SSE] Seluruh proses batch prediksi AI telah selesai.");
            res.write('data: [DONE]\n\n');
            res.end();

        } catch (error) {
            console.error("Error di [CustomerPredictStreamController]:", error.message);
            res.write(`data: ${JSON.stringify({ status: "error", message: error.message })}\n\n`);
            res.end();
        }
    }
}

module.exports = { CustomerController };