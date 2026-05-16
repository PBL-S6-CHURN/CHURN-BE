// Di dalam file test-ai.js atau Controller
const path = require('path');
const { spawn } = require('child_process');
const scriptPath = path.join(__dirname, 'ml_models', 'churn_prediction', 'predict.py');

// 1. Data contoh (sesuaikan dengan kolom di file excel kamu)
const manualInput = {
    "total_users": 1, // Sesuaikan jika model butuh kolom ini
    "monthly_usage_hrs": 238.4,
    "feature_adoption_pct": 54.9,
    "support_tickets_count": 7,
    "nps_score": 4,
    "payment_delay_count": 1,
    "tenure_months": 26,
    "last_login_days_ago": 83
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
            }
        } catch (e) {
            console.error("Gagal membaca output Python:", output);
        }
    });
}

// Jalankan tes
testPrediction(manualInput);