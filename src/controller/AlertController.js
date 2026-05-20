"use strict";

const { AlertModel } = require("../model/AlertModel");

class AlertController {
    static async AlertGetController(req, res) {
        try {
            const { page = 1, limit = 5 } = req.query;
            const data = await AlertModel.GetAllAlertsModel(page, limit);
            
            return res.status(200).json({
                status: "success",
                metadata: {
                    total_data: data.totalData,
                    total_pages: data.totalPages,
                    current_page: data.currentPage,
                    page_size: parseInt(limit),
                },
                data: data.alerts
            });
        } catch (error) {
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    static async AlertGetByIdController(req, res) {
        try {
            const { id } = req.params;
            const alerts = await AlertModel.GetAlertByIdModel(id);
            
            if (!alerts) {
                return res.status(404).json({ status: "error", message: "Alert tidak ditemukan" });
            }

            const responseData = {
                alert_details: {
                    id: alerts.alert_id,
                    type: alerts.alert_type,
                    severity: alerts.alert_severity,
                    message: alerts.alert_message,
                    is_read: alerts.alert_is_read,
                    triggered_at: alerts.alert_triggered_at,
                    snapshot_data: alerts.alert_snapshot_data
                },
                ai_prediction_analysis: alerts.ai_risk_level ? {
                    churn_score: alerts.ai_churn_score,
                    risk_score_pct: alerts.ai_risk_score_pct, // Skor dalam bentuk persen/probabilitas
                    risk_level: alerts.ai_risk_level,
                    churn_status: alerts.ai_churn_score === 1 ? "YES" : "NO",
                    churn_factors: alerts.ai_churn_factors ? alerts.ai_churn_factors.split('\n') : [],
                    solutions: alerts.ai_solutions ? alerts.ai_solutions.split('\n') : []
                } : null, // Berjaga-jaga jika AI belum sempat menganalisis customer ini
                customer_profile: {
                    id: alerts.id, // ID internal database customer
                    customer_id: alerts.customer_id, // Code customer (misal C-0005)
                    plan_id: alerts.plan_id,
                    contract_id: alerts.contract_id,
                    monthly_usage_hrs: alerts.monthly_usage_hrs,
                    feature_adoption_pct: alerts.feature_adoption_pct,
                    support_ticket_last_90d: alerts.support_ticket_last_90d,
                    tenure_months: alerts.tenure_months,
                    last_login_days_ago: alerts.last_login_days_ago,
                    monthly_revenue: alerts.monthly_revenue,
                    total_users: alerts.total_users,
                    nps_score: alerts.nps_score,
                    payment_delay_count: alerts.payment_delay_count,
                    created_at: alerts.created_at
                }
            };

            return res.status(200).json({ status: "success", data: responseData});
        } catch (error) {
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    static async AlertRiskController(req, res) {
        try {
            const { risk } = req.params;
            res.send(`Lihat Alert risk : ${risk}`);
        } catch (error) {
            console.log(error);
        }
    }

    static async AlertStatsController(req, res) {
        try {
            const stats = await AlertModel.GetAlertStatsModel();
            return res.status(200).json({ status: "success", data: stats });
        } catch (error) {
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    static async AlertPlanController(req, res) {
        try {
            const { plan } = req.params;
            const { page = 1, limit = 5 } = req.query;

            const data = await AlertModel.GetAlertsByPlanModel(plan, page, limit);

            return res.status(200).json({
                status: "success",
                metadata: {
                    total_data: data.totalData,
                    total_pages: data.totalPages,
                    current_page: data.currentPage,
                    page_size: parseInt(limit),
                    filtered_by_plan: plan
                },
                data: data.alerts
            });
        } catch (error) {
            console.log(error);
        }
    }
    static async AlertResolvedController(req, res) {
        try {
            const { id } = req.params;
            const updatedAlert = await AlertModel.UpdateAlertToResolvedModel(id);
            
            if (!updatedAlert) {
                return res.status(404).json({ status: "error", message: "Alert gagal diupdate, ID tidak ditemukan" });
            }
            
            return res.status(200).json({
                status: "success",
                message: `Alert dengan ID ${id} berhasil ditandai sebagai selesai/dibaca.`,
                data: updatedAlert
            });
        } catch (error) {
            return res.status(500).json({ status: "error", message: error.message });
        }
    }
}

module.exports = { AlertController };