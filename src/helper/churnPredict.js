// Lokasi: helpers/pythonRunner.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Helper untuk menjalankan script Python predictor
 * @param {Object} inputData - Data JSON dari client (req.body)
 * @returns {Promise<Object>} - Mengembalikan Promise berisi objek hasil dari Python
 */
const churnPredict = (inputData) => {
    return new Promise((resolve, reject) => {
        // Tentukan path ke file predict.py secara aman
        const scriptPath = path.join(__dirname, '..', '..', 'ml_models', 'churn_prediction', 'predict.py');

        // Jalankan proses Python
        const pythonProcess = spawn('python', [scriptPath]);

        // Kirim data ke Python via stdin
        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();

        let output = "";
        let errorOutput = "";

        // Tangkap stdout
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        // Tangkap stderr
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        // Ketika proses Python selesai
        pythonProcess.on('close', (code) => {
            const cleanOutput = output.trim();

            if (errorOutput) {
                console.error("Stderr dari Python:", errorOutput);
            }

            try {
                const result = JSON.parse(cleanOutput);
                resolve(result); // Berhasil parsing JSON, kembalikan data
            } catch (parseError) {
                console.error("Gagal parsing JSON. Output mentah Python:", output);
                reject(new Error("Format output dari Python tidak valid JSON"));
            }
        });
    });
};

module.exports = {
    churnPredict
};