'use strict';

const axios = require('axios');

const checkSentimentToFlask = async (text) => {
    try {
        // Memanggil API Flask di port 5000
        const response = await axios.post('http://localhost:5000/sentiment', { text });
        const result = response.data.data;

        // --- PROSES HUMANISASI DATA ---
        const sentiment = result.sentiment; // "Positif" atau "Negatif"
        const percentage = (result.confidence * 100).toFixed(1) + '%';
        
        // Memisahkan kata berdasarkan LIME
        const kataMendukung = result.explanation.kata_kunci
            .filter(k => k.keterangan === 'mendukung')
            .map(k => k.kata)
            .join(', ');
            
        const kataMelawan = result.explanation.kata_kunci
            .filter(k => k.keterangan === 'melawan')
            .map(k => k.kata)
            .join(', ');

        // Merangkai penjelasan kalimat manusia
        let penjelasan = `AI memprediksi kalimat ini bersentimen ${sentiment} dengan tingkat keyakinan ${percentage}. `;
        
        if (result.explanation.dikoreksi_oleh_sistem_negasi) {
            penjelasan += `Sistem mendeteksi adanya pola penyangkalan (seperti kata 'tidak', 'bukan') sehingga mengoreksi tebakan awal. `;
        }

        if (kataMendukung) {
            penjelasan += `Kata yang sangat mendorong hasil ${sentiment} ini adalah: [${kataMendukung}]. `;
        }
        if (kataMelawan) {
            penjelasan += `Sebaliknya, kata yang bermakna melawan hasil tersebut adalah: [${kataMelawan}].`;
        }

        // Return data yang sudah rapi untuk Frontend
        return {
            teks_input: result.original_text,
            sentiment: sentiment,
            probability: percentage,
            explainable: penjelasan.trim(),
            raw_keywords: result.explanation.kata_kunci // Disimpan jika FE butuh untuk mewarnai teks
        };

    } catch (error) {
        throw new Error(error.response?.data?.message || "Gagal menghubungi server Flask AI di port 5000");
    }
};

module.exports = { checkSentimentToFlask };