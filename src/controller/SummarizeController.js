'use strict';

const { getSummarizeData } = require('../helper/summarizeHelper');

class SummarizeController {

    // GET /summarize
    // Mengembalikan semua data: percentage + summary + top5Comments
    static async SummarizeGetController(req, res) {
        try {
            const data = await getSummarizeData();

            return res.status(200).json({
                status: "success",
                data
            });

        } catch (error) {
            console.error('[SummarizeController] Error:', error.message);
            return res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // GET /summarize/ratings
    // Hanya mengembalikan persentase Positif & Negatif
    static async SummarizeGetRatingsController(req, res) {
        try {
            const { percentage } = await getSummarizeData();

            return res.status(200).json({
                status: "success",
                data: { percentage }
            });

        } catch (error) {
            console.error('[SummarizeController] Error:', error.message);
            return res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // GET /summarize/sentiment
    // Hanya mengembalikan paragraf summarize Positif & Negatif
    static async SummarizeSentimentController(req, res) {
        try {
            const { summary } = await getSummarizeData();

            return res.status(200).json({
                status: "success",
                data: { summary }
            });

        } catch (error) {
            console.error('[SummarizeController] Error:', error.message);
            return res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }
}

module.exports = { SummarizeController };