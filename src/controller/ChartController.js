'use strict';

const { getChurnChartData } = require('../helper/chartHelper');

class ChartController {

    // GET /dashboard/churn-chart
    // Mengembalikan data gambar grafik dalam format Base64 untuk dibaca Frontend
    static async ChurnChartGetController(req, res) {
        try {
            const chartData = await getChurnChartData();

            // chartData sudah berisi { status: "success", image: "..." } dari Flask
            return res.status(200).json(chartData);

        } catch (error) {
            console.error('[ChartController] Error:', error.message);
            return res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }
}

module.exports = { ChartController };