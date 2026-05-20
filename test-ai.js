// Di dalam file test-ai.js atau Controller
const path = require('path');
const { spawn } = require('child_process');
const scriptPath = path.join(__dirname, 'ml_models', 'churn_prediction', 'predict.py');

// 1. Data contoh (sesuaikan dengan kolom di file excel kamu)
// Di dalam file test-ai.js

// 1. Data contoh yang sengaja dibuat "buruk" agar memicu status CHURNED
const manualInput = {
    "total_users": 5,
    "monthly_usage_hrs": 350.5,
    "feature_adoption_pct": 85.0,
    "support_tickets_count": 1,        // Komplain sedikit
    "nps_score": 9,                    // Sangat puas
    "payment_delay_count": 0,
    "tenure_months": 24,
    "last_login_days_ago": 2           // Baru kemarin login
};

function testPrediction(data) {
    console.log("--- Mengetes Model AI ---");
    console.log("Input Data:", data);

    const pythonProcess = spawn('python', [scriptPath]);

    // Kirim data ke Python
    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    let output = "";
    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Error dari Python: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`\n--- Hasil Prediksi ---`);
        try {
            const result = JSON.parse(output);
            if (result.status === "success") {
                console.log(`Skor: ${result.score}`);
                console.log(`Risk: ${result.risk_level}`);
                console.log(`Churn Status: ${result.churn_status}`);
            } else {
                console.error("Gagal:", result.message);
            }node 
        } catch (e) {
            console.error("Gagal membaca output Python:", output);
        }
    });
}

// Jalankan tes
testPrediction(manualInput);