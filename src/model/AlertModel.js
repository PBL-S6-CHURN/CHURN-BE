"use strict";

const { query } = require("../config");

class AlertModel {
  /**
   * Membuat alert baru secara cerdas (mencegah duplikasi alert aktif)
   */
  static async CreateAlertIfNotExist(
    customerIdInt,
    type,
    severity,
    message,
    snapshotData
  ) {
    try {
      // 1. Cek apakah ada alert sejenis yang masih aktif (belum dibaca) untuk customer ini
      const checkQuery = `
                SELECT id FROM alerts 
                WHERE customer_id = $1 AND type = $2 AND is_read = false
                LIMIT 1
            `;
      const checkResult = await query(checkQuery, [customerIdInt, type]);

      // Jika sudah ada alert aktif yang sama, abaikan saja (biar tidak spam database)
      if (checkResult.rows.length > 0) {
        return null;
      }

      // 2. Jika belum ada, masukkan alert baru
      const insertQuery = `
                INSERT INTO alerts (customer_id, type, severity, message, data)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
      const result = await query(insertQuery, [
        customerIdInt,
        type,
        severity,
        message,
        JSON.stringify(snapshotData), // simpan object data sebagai string JSONB
      ]);

      console.log(
        `[ALERT TRIGGERED] Berhasil membuat alert [${type}] untuk Customer ID: ${customerIdInt}`
      );
      return result.rows[0];
    } catch (error) {
      console.error(
        "Error di [AlertModel.CreateAlertIfNotExist]:",
        error.message
      );
      // Jangan throw error ke atas agar jika alert gagal, proses web utama / AI tidak ikut mati
    }
  }

  // Mengambil semua alert (dengan pagination & LEFT JOIN ke customer agar tahu nama/ID kodenya)
  static async GetAllAlertsModel(page = 1, limit = 5) {
    try {
      // const offset = (page - 1) * limit;
      const dataQuery = `
                SELECT al.*, cu.customer_id AS customer_code
                FROM alerts al
                LEFT JOIN customers cu ON al.customer_id = cu.id
                ORDER BY al.created_at DESC LIMIT $1 OFFSET $2
            `;
      const countQuery = `SELECT COUNT(*) FROM alerts`;

      const [dataRes, countRes] = await Promise.all([
        query(dataQuery, [limit, (page - 1) * limit]),
        query(countQuery),
      ]);

      return {
        alerts: dataRes.rows,
        totalData: parseInt(countRes.rows[0].count),
        totalPages: Math.ceil(countRes.rows[0].count / limit),
        currentPage: parseInt(page),
      };
    } catch (error) {
      console.error("Error [GetAllAlertsModel]:", error.message);
      throw error;
    }
  }

  // Mengambil Detail Alert Berdasarkan ID
  static async GetAlertByIdModel(id) {
    try {
      const textQuery = `
                SELECT 
                    al.id AS alert_id,
                    al.type AS alert_type,
                    al.severity AS alert_severity,
                    al.message AS alert_message,
                    al.data AS alert_snapshot_data,
                    al.is_read AS alert_is_read,
                    al.created_at AS alert_triggered_at,
                    
                    -- Data Analisis AI dari tabel predicts
                    pr.risk AS ai_risk_level,
                    pr.risk_score AS ai_risk_score_pct,
                    pr.score AS ai_churn_score,
                    pr.cause AS ai_churn_factors,
                    pr.solution AS ai_solutions,

                    -- Semua data lengkap dari tabel customers
                    cu.*
                FROM alerts al
                LEFT JOIN customers cu ON al.customer_id = cu.id
                LEFT JOIN predicts pr ON cu.id = pr.customer_id
                WHERE al.id = $1
            `;
      const result = await query(textQuery, [id]);
      return result.rows[0];
    } catch (error) {
      console.error("Error [GetAlertByIdModel]:", error.message);
      throw error;
    }
  }

  // Mengambil Alert Berdasarkan Tingkat Severity (low, medium, high)
  static async GetAlertsBySeverityModel(severity, page = 1, limit = 5) {
    try {
      const offset = (page - 1) * limit;
      const dataQuery = `
                SELECT al.*, cu.customer_id AS customer_code
                FROM alerts al
                LEFT JOIN customers cu ON al.customer_id = cu.id
                WHERE al.severity = $1
                ORDER BY al.created_at DESC
                LIMIT $2 OFFSET $3
            `;
      const countQuery = `SELECT COUNT(*) FROM alerts WHERE severity = $1`;

      const [dataRes, countRes] = await Promise.all([
        query(dataQuery, [severity.toLowerCase(), limit, offset]),
        query(countQuery, [severity.toLowerCase()]),
      ]);

      return {
        alerts: dataRes.rows,
        totalData: parseInt(countRes.rows[0].count),
        totalPages: Math.ceil(countRes.rows[0].count / limit),
        currentPage: parseInt(page),
      };
    } catch (error) {
      console.error("Error [GetAlertsBySeverityModel]:", error.message);
      throw error;
    }
  }

  // menampilkan data alert by plan
  static async GetAlertsByPlanModel(plan, page = 1, limit = 5) {
    try {
      const offset = (page - 1) * limit;
      const dataQuery = `
    SELECT 
        al.*, 
        cu.customer_id AS customer_code,
        p.plan_name
    FROM alerts al
    LEFT JOIN customers cu ON al.customer_id = cu.id
    LEFT JOIN plans p ON cu.plan_id = p.id
    WHERE LOWER(p.plan_name) = $1
    ORDER BY al.created_at DESC
    LIMIT $2 OFFSET $3
`;
      const countQuery = `
    SELECT COUNT(*) 
    FROM alerts al
    LEFT JOIN customers cu ON al.customer_id = cu.id
    LEFT JOIN plans p ON cu.plan_id = p.id
    WHERE LOWER(p.plan_name) = $1
`;

      const [dataRes, countRes] = await Promise.all([
        query(dataQuery, [plan.toLowerCase(), limit, offset]),
        query(countQuery, [plan.toLowerCase()]),
      ]);

      return {
        alerts: dataRes.rows,
        totalData: parseInt(countRes.rows[0].count),
        totalPages: Math.ceil(countRes.rows[0].count / limit),
        currentPage: parseInt(page),
      };
    } catch (error) {
      console.error("Error [GetAlertsByPlanModel]:", error.message);
      throw error;
    }
  }

  // Statistik Jumlah Alert Berdasarkan Severity & Status Baca (Untuk Dashboard)
  static async GetAlertStatsModel() {
    try {
      const textQuery = `
                SELECT 
                    COUNT(*) AS total_alerts,
                    COUNT(CASE WHEN is_read = false THEN 1 END) AS unread_alerts,
                    COUNT(CASE WHEN severity = 'high' AND is_read = false THEN 1 END) AS active_high_severity,
                    COUNT(CASE WHEN severity = 'medium' AND is_read = false THEN 1 END) AS active_medium_severity,
                    COUNT(CASE WHEN severity = 'low' AND is_read = false THEN 1 END) AS active_low_severity
                FROM alerts;
            `;
      const result = await query(textQuery);
      return result.rows[0];
    } catch (error) {
      console.error("Error [GetAlertStatsModel]:", error.message);
      throw error;
    }
  }

  // Mengubah status is_read menjadi true (Resolved / Mark as Read)
  static async UpdateAlertToResolvedModel(id) {
    try {
      const textQuery = `
                UPDATE alerts 
                SET is_read = true 
                WHERE id = $1 
                RETURNING *
            `;
      const result = await query(textQuery, [id]);
      return result.rows[0];
    } catch (error) {
      console.error("Error [UpdateAlertToResolvedModel]:", error.message);
      throw error;
    }
  }
}

module.exports = { AlertModel };
