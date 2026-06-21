'use strict';

const { query } = require("../config");

require('dotenv').config();

class PredictModel {
    /**
     * Menyimpan atau memperbarui hasil prediksi ke database tabel predicts
     */
    static async SaveOrUpdatePredict(customerIdInt, risk, score, riskScorePct, causeArray, solutionArray, plattScorePct = null) {
        try {
            const causeText    = Array.isArray(causeArray)    ? causeArray.join('\n')    : (causeArray    || '');
            const solutionText = Array.isArray(solutionArray) ? solutionArray.join('\n') : (solutionArray || '');

            const checkResult = await query('SELECT id FROM predicts WHERE customer_id = $1', [customerIdInt]);

            if (checkResult.rows.length > 0) {
                // UPDATE — tambah platt_score_pct = $7
                const updateQuery = `
                    UPDATE predicts 
                    SET risk            = $2,
                        score           = $3,
                        risk_score      = $4,
                        cause           = $5,
                        solution        = $6,
                        platt_score_pct = $7,
                        updated_at      = CURRENT_TIMESTAMP
                    WHERE customer_id = $1
                    RETURNING *
                `;
                const result = await query(updateQuery, [customerIdInt, risk, score, riskScorePct, causeText, solutionText, plattScorePct]);
                return result.rows[0];
            } else {
                // INSERT — tambah kolom & value platt_score_pct
                const insertQuery = `
                    INSERT INTO predicts (customer_id, risk, score, risk_score, cause, solution, platt_score_pct)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                `;
                const result = await query(insertQuery, [customerIdInt, risk, score, riskScorePct, causeText, solutionText, plattScorePct]);
                return result.rows[0];
            }

        } catch (error) {
            console.error("Error terjadi di dalam [PredictModel.SaveOrUpdatePredict]:", error.message);
            throw error;
        }
    }
}

module.exports = { PredictModel };