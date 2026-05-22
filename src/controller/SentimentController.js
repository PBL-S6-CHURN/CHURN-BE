'use strict';

const { checkSentimentToFlask } = require('../helper/sentimentHelper');

class SentimentController {
    // POST /sentiment/check
    static async checkSentiment(req, res) {
        try {
            const { text } = req.body;

            // Validasi input
            if (!text || text.trim() === '') {
                return res.status(400).json({
                    status: "error",
                    message: "Teks input tidak boleh kosong"
                });
            }

            // Panggil Helper
            const data = await checkSentimentToFlask(text);

            return res.status(200).json({
                status: "success",
                data: data
            });

        } catch (error) {
            console.error('[SentimentController] Error:', error.message);
            return res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }
}

module.exports = { SentimentController };