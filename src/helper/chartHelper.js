'use strict';

const axios = require('axios');

// ── Fungsi utama — Meminta data Grafik Churn (Base64) dari Flask ──────────────
async function getChurnChartData() {
    try {
        // Memanggil API Flask di port 5001 (sesuaikan dengan port Flask Anda, misal 5000 atau 5001)
        const response = await axios.get('http://localhost:5001/churn/churn-chart');
        
        // Flask mengembalikan struktur: { status: "success", image: "data:image/png;base64,..." }
        // Kita langsung kembalikan isinya ke Controller
        return response.data;

    } catch (error) {
        console.error('[ChartHelper] Error fetching chart from Flask:', error.message);
        throw new Error(
            error.response?.data?.message || 
            "Gagal menghubungi server Flask untuk grafik. Pastikan server Python menyala."
        );
    }
}

module.exports = { getChurnChartData };