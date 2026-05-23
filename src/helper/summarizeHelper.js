'use strict';

const axios = require('axios');

// ── Fungsi utama — Meminta data Summarize dari AI Flask ──────────────
async function getSummarizeData() {
    try {
        // Memanggil API Flask di port 5000 (yang akan memproses CSV via Bi-LSTM)
        // const response = await axios.get('http://localhost:5000/summarize');
        const response = await axios.get('http://localhost:5001/summarize');
        
        // Flask mengembalikan struktur: { percentage: {...}, summary: {...}, top5Comments: [...] }
        // Kita langsung kembalikan isinya ke Controller
        return response.data.data;

    } catch (error) {
        console.error('[SummarizeHelper] Error fetching from Flask:', error.message);
        throw new Error(
            error.response?.data?.message || 
            "Gagal menghubungi server Flask AI di port 5000. Pastikan server Python menyala."
        );
    }
}

module.exports = { getSummarizeData };