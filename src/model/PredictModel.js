'use strict';

// Gunakan dekonstruksi { query } dari folder config Anda
const { query } = require("../config");

require('dotenv').config();

class PredictModel {
    /**
     * Menyimpan atau memperbarui hasil prediksi ke database tabel predicts
     */
    static async SaveOrUpdatePredict(customerIdInt, risk, score, riskScorePct, causeArray, solutionArray) {
        try {
            // 1. Amankan penggabungan array ke string di dalam try
            const causeText = Array.isArray(causeArray) ? causeArray.join('\n') : (causeArray || '');
            const solutionText = Array.isArray(solutionArray) ? solutionArray.join('\n') : (solutionArray || '');

            // 2. Cek apakah prediksi untuk customer_id ini sudah ada
            const checkQuery = 'SELECT id FROM predicts WHERE customer_id = $1';
            
            // FIX: Mengubah db.query menjadi query agar tidak error "db is not defined"
            const checkResult = await query(checkQuery, [customerIdInt]);

            if (checkResult.rows.length > 0) {
                // Jika sudah ada, lakukan UPDATE
                const updateQuery = `
                    UPDATE predicts 
                    SET risk = $2, score = $3, risk_score = $4, cause = $5, solution = $6, updated_at = CURRENT_TIMESTAMP
                    WHERE customer_id = $1
                    RETURNING *
                `;
                const result = await query(updateQuery, [customerIdInt, risk, score, riskScorePct, causeText, solutionText]);
                return result.rows[0];
            } else {
                // Jika belum ada, lakukan INSERT
                const insertQuery = `
                    INSERT INTO predicts (customer_id, risk, score, risk_score, cause, solution)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;
                const result = await query(insertQuery, [customerIdInt, risk, score, riskScorePct, causeText, solutionText]);
                return result.rows[0];
            }
            
        } catch (error) {
            // Mengamankan jika ada error query/database agar tidak membuat aplikasi crash/mati
            console.error("Error terjadi di dalam [PredictModel.SaveOrUpdatePredict]:", error.message);
            throw error; // Lempar ke catch milik Controller agar ditampilkan berupa JSON error
        }
    }
}

module.exports = { PredictModel };