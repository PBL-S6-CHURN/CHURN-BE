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
        // 1. Ambil data page dan limit seperti biasa
        const { page = 1, limit = 5 } = req.query;

        // 2. Tarik data customer mentah dari database
        const data = await CustomerModel.ShowAllCustomersModel(page, limit);
        const customers = data.customers;


        // 3. LOOPING & PREDIKSI LANGSUNG DI TEMPAT
        for (const customer of customers) {
            try {
            // Bungkus data sesuai format yang diminta oleh helper Python (churnPredict)
            const inputData = {
                customer_id: customer.customer_id,
                monthly_usage_hrs: parseFloat(customer.monthly_usage_hrs),
                feature_adoption_pct: parseFloat(customer.feature_adoption_pct),
                support_tickets_last_90d: parseInt(
                customer.support_ticket_last_90d
                ),
                tenure_months: parseInt(customer.tenure_months),
                nps_score: parseInt(customer.nps_score),
                payment_delay_count: parseInt(customer.payment_delay_count),
                plan_type: customer.plan_name,
                contract_type: customer.contract_name,
                monthly_revenue: parseFloat(customer.monthly_revenue),
                total_users: parseInt(customer.total_users),
                last_login_days_ago: parseInt(customer.last_login_days_ago),
            };

            // Panggil helper Python secara realtime
            const result = await churnPredict(inputData);

            await CustomerController.#executeLivePrediction(data.customers);
                
            if (result.status === "success") {
                // Langsung simpan/update ke database tabel predicts
                await PredictModel.SaveOrUpdatePredict(
                customer.id,
                result.risk_level,
                result.score,
                result.risk_score_pct,
                result.churn_factors,
                result.solutions
                );
                console.log(
                `> Prediksi realtime SUKSES untuk: ${customer.customer_id}`
                );
            }
            } catch (loopError) {
            // Jika ada 1 customer bermasalah, loop tidak pecah dan tetap lanjut ke customer berikutnya
            console.error(
                `> Prediksi realtime GAGAL untuk ${customer.customer_id}:`,
                loopError.message
            );
            }
        }

        console.log(
            "[LIVE PREDICT] Looping prediksi selesai. Mengambil ulang data yang sudah terupdate..."
        );

        // 4. AMBIL ULANG DATA TERBARU
        // Karena data di tabel predicts baru saja berubah/terisi setelah di-loop di atas,
        // kita panggil sekali lagi agar data yang di-map ke response JSON tidak bernilai null!
        const updatedData = await CustomerModel.ShowAllCustomersModel(
            page,
            limit
        );
        const updatedCustomers = updatedData.customers;

        // 5. Mapping hasil akhir ke format JSON Response
        const resultPredict = updatedCustomers.map((customer) => {
            return {
            id: customer.id,
            customer_id: customer.customer_id,
            plan_id: customer.plan_id,
            contract_id: customer.contract_id,
            last_login_days_ago: customer.last_login_days_ago,
            feature_adoption_pct: customer.feature_adoption_pct,
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
                    risk_level: customer.risk,
                    churn_status: customer.score === 1 ? "YES" : "NO",
                    churn_factors: customer.cause
                        ? customer.cause.split("\n")
                        : [],
                    solutions: customer.solution
                        ? customer.solution.split("\n")
                        : [],
                    }
                : null,
            };
        });

        // 6. Kembalikan Response ke Postman / Frontend
        res.status(200).json({
            status: "success",
            metadata: {
            total_data: updatedData.totalData,
            total_pages: updatedData.totalPages,
            current_page: updatedData.currentPage,
            page_size: limit,
            },
            data: resultPredict,
        });
        } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "error",
            message: error.message,
        });
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
        });
        }
    }

    static async CustomerTypeController(req, res) {
        try {
        const { type } = req.params;
        const { page, limit } = req.query;

        const data = await CustomerModel.FilterCustomerTypeModel(
            type,
            page,
            limit
        );
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
        res.status(500).json({
            status: "error",
            message: error.message,
        });
        }
    }

    static async CustomerSearchController(req, res) {
        try {
        CustomerValidator.validateSearchPayload(req.query);

        const { customer_id, page = 1, limit = 5 } = req.query;

        const data = await CustomerModel.SearchCustomerbyCustomerIdModel(
            customer_id,
            page,
            limit
        );
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
        // Cek apakah ini error yang kita buat sendiri (400/401)
        if (error instanceof ClientError) {
            return res.status(error.statusCode).json({
            status: "fail",
            message: error.message,
            });
        }

        // Jika bukan (misal error database/server crash), kirim status 500
        console.error(error); // Tetap log untuk internal
        return res.status(500).json({
            status: "error",
            message: "Terjadi kegagalan pada server kami",
        });
        }
    }

    static async CustomerAddController(req, res) {
        try {
        CustomerValidator.validateAddPayload(req.body);
        const {
            customer_id,
            plan_id,
            contract_id,
            monthly_usage_hrs,
            feature_adoption_pct,
            payment_delay_count,
            support_ticket_last_90d,
            nps_score,
            tenure_months,
            last_login_days_ago,
            monthly_revenue,
            total_users,
        } = req.body;
        const data = await CustomerModel.AddCustomerModel(
            customer_id,
            plan_id,
            contract_id,
            monthly_usage_hrs,
            feature_adoption_pct,
            payment_delay_count,
            support_ticket_last_90d,
            nps_score,
            tenure_months,
            last_login_days_ago,
            monthly_revenue,
            total_users
        );
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
            status: "fail",
            message: error.message,
            });
        }

        // Jika bukan (misal error database/server crash), kirim status 500
        console.error(error); // Tetap log untuk internal
        return res.status(500).json({
            status: "error",
            message: "Terjadi kegagalan pada server kami",
        });
        }
    }

    static async CustomerUploadFile(req, res) {
        try {
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const formattedData = data.map((row, index) => {
            // Mapping Plan Name ke ID
            let planId;
            const planName = row.plan_type ? row.plan_type.toLowerCase() : "";
            if (planName === "starter") planId = 1;
            else if (planName === "professional") planId = 2;
            else if (planName === "enterprise") planId = 3;
            else
            throw new ClientError(
                `Baris ${index + 2}: Plan '${row.plan_type}' tidak dikenal`
            );

            // Mapping Contract Name ke ID
            let contractId;
            const contractName = row.contract_type
            ? row.contract_type.toLowerCase()
            : "";
            if (contractName === "monthly") contractId = 1;
            else if (contractName === "annual") contractId = 2;
            else
            throw new ClientError(
                `Baris ${index + 2}: Contract '${row.contract_type}' tidak dikenal`
            );

            // Sesuaikan nama kolom Excel dengan nama properti yang diharapkan Joi/Model
            return {
            customer_id: row.customer_id,
            plan_id: planId,
            contract_id: contractId,
            monthly_usage_hrs: parseFloat(row.monthly_usage_hrs),
            feature_adoption_pct: parseFloat(row.feature_adoption_pct),
            payment_delay_count: parseInt(row.payment_delay_count),
            support_ticket_last_90d: parseInt(row.support_tickets_last_90d),
            nps_score: parseInt(row.nps_score),
            tenure_months: parseInt(row.tenure_months),
            last_login_days_ago: parseInt(row.last_login_days_ago),
            monthly_revenue: parseFloat(row.monthly_revenue),
            total_users: parseInt(row.total_users),
            };
        });

        formattedData.forEach((data, index) => {
            CustomerValidator.validateAddPayload(data);
        });

        const result = await CustomerModel.UploadExcellCustomerModel(
            formattedData
        );
        res.status(200).json({
            status: "success",
            data: {
            message: `${result.length} data customer berhasil diimpor dari Excel`,
            },
        });
        } catch (error) {
        // Gunakan helper handleError yang sudah kita buat sebelumnya
        if (error instanceof ClientError) {
            return res
            .status(error.statusCode)
            .json({ status: "fail", message: error.message });
        }
        console.error(error);
        res
            .status(500)
            .json({ status: "error", message: "Gagal memproses file excel" });
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
        });
        }
    }

    static async CustomerFilterbyRisk(req, res) {
        try {
            const { risk } = req.params;
            const { page, limit } = req.query;

            const data = await CustomerModel.FilterCustomerRiskModel(risk, page, limit);
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
            });
        }
    }

    // coba predict manual
    static async PredictManual(req, res) {
        try {
        const inputData = req.body;

        // 1. Validasi Input
        if (!inputData || Object.keys(inputData).length === 0) {
            return res.status(400).json({
            status: "error",
            message: "Body request tidak boleh kosong",
            });
        }

        const customerIdString = inputData.customer_id;

        // 2. Panggil Helper untuk Mengeksekusi Python (Logika dipisahkan ke helper)
        const result = await churnPredict(inputData);

        // 3. Tangani Response Berdasarkan Status dari Python
        if (result.status === "success") {
            console.log("=== DEBUG PREDICT MANUAL ===");
            console.log("Mencari Customer ID String:", customerIdString);

            const customerDb = await CustomerModel.GetCustomerByStringIdModel(
            customerIdString
            );

            console.log("Hasil pencarian customerDb di Postgres:", customerDb);
            // ===================================

            if (customerDb) {
            console.log(
                `[INFO] Customer ditemukan dengan ID Integer: ${customerDb.id}. Menyimpan ke tabel predicts...`
            );
            await PredictModel.SaveOrUpdatePredict(
                customerDb.id,
                result.risk_level,
                result.score,
                result.risk_score_pct,
                result.churn_factors,
                result.solutions
            );
            } else {
            console.log(
                `[WARN] Customer dengan ID string ${inputData.customer_id} tidak ditemukan di DB. Data tidak disimpan ke tabel predicts.`
            );
            }

            return res.status(200).json({
            status: "success",
            message: "Prediksi berhasil dihitung oleh AI",
            data: {
                score: result.score,
                risk_score_pct: result.risk_score_pct,
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
        return res.status(500).json({
            status: "error",
            message:
            error.message || "Terjadi kesalahan pada internal server backend",
        });
        }
    }

    static async #executeLivePrediction(customers) {
        console.log(`[LIVE PREDICT] Memproses ${customers.length} data customer ke AI model...`);
        for (const customer of customers) {
            try {
                const inputData = {
                    customer_id: customer.customer_id,
                    monthly_usage_hrs: parseFloat(customer.monthly_usage_hrs),
                    feature_adoption_pct: parseFloat(customer.feature_adoption_pct),
                    support_tickets_last_90d: parseInt(customer.support_ticket_last_90d),
                    tenure_months: parseInt(customer.tenure_months),
                    nps_score: parseInt(customer.nps_score),
                    payment_delay_count: parseInt(customer.payment_delay_count),
                    plan_type: customer.plan_name, 
                    contract_type: customer.contract_name,
                    monthly_revenue: parseFloat(customer.monthly_revenue),
                    total_users: parseInt(customer.total_users),
                    last_login_days_ago: parseInt(customer.last_login_days_ago)
                };

                const result = await churnPredict(inputData);

                if (result.status === "success") {
                    // 1. Simpan hasil prediksi AI seperti biasa
                    await PredictModel.SaveOrUpdatePredict(
                        customer.id, 
                        result.risk_level, 
                        result.score, 
                        result.risk_score_pct, 
                        result.churn_factors, 
                        result.solutions
                    );
                    
                    // Pemicu Alert 1: Berdasarkan Hasil AI (Risk Level HIGH)
                    if (result.risk_level === "HIGH") {
                        await AlertModel.CreateAlertIfNotExist(
                            customer.id,
                            'High Churn Risk',
                            'high',
                            `Customer ${customer.customer_id} terdeteksi oleh AI memiliki risiko Churn yang TINGGI (${result.risk_score_pct}%).`,
                            { risk_score: result.risk_score_pct, factors: result.churn_factors }
                        );
                    }

                    // Pemicu Alert 2: Berdasarkan Aturan Bisnis (Kritikal) - NPS Terlalu Rendah
                    if (parseInt(customer.nps_score) <= 3) {
                        await AlertModel.CreateAlertIfNotExist(
                            customer.id,
                            'Low NPS Score',
                            'medium',
                            `Customer ${customer.customer_id} memberikan nilai kepuasan (NPS) sangat rendah: ${customer.nps_score}.`,
                            { nps_score: customer.nps_score }
                        );
                    }

                    // Pemicu Alert 3: Masalah Administrasi - Sering Telat Bayar
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
}

module.exports = { CustomerController };
