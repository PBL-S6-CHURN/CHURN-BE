import sys
import json
import joblib
import pandas as pd
import os
import warnings

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'churn_best_model.pkl')

try:
    loaded_object = joblib.load(MODEL_PATH)
    if isinstance(loaded_object, dict) and 'model' in loaded_object:
        model = loaded_object['model']
    else:
        model = loaded_object

    input_json = sys.stdin.read().strip()
    if not input_json:
        raise ValueError("Tidak ada input data yang diterima")
    
    data_dict = json.loads(input_json)
    df_raw = pd.DataFrame([data_dict])

    feature_names = [
        "total_users", "monthly_usage_hrs", "feature_adoption_pct", 
        "support_tickets_count", "nps_score", "tenure_months", "last_login_days_ago"
    ]
    
    for col in feature_names:
        if col not in df_raw.columns:
            df_raw[col] = 0

    df_filtered = df_raw[feature_names]

    # 1. Dapatkan Prediksi Dasar (0 atau 1)
    prediction_raw = model.predict(df_filtered)[0]
    
    # 2. Dapatkan Skor (0-100)
    # Jika model tidak dukung probabilitas, kita buat simulasi skor berdasarkan hasil prediksi
    if hasattr(model, "predict_proba"):
        prob = model.predict_proba(df_filtered)[:, 1][0]
        score = round(prob * 100)
    else:
        # Jika proba tidak tersedia, gunakan skor statis berdasarkan hasil prediksi
        score = 85 if prediction_raw == 1 else 15

    # 3. Tentukan Risk Level berdasarkan permintaanmu
    if score <= 30:
        risk_level = "LOW"
    elif score <= 65:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    # 4. Tentukan Status (YES jika Churn, NO jika tidak)
    status_churn = "YES" if prediction_raw == 1 else "NO"

    # 5. Cetak Hasil Final
    print(json.dumps({
        "status": "success",
        "score": score,
        "risk_level": risk_level,
        "churn_status": status_churn,
        "label": "Churn" if prediction_raw == 1 else "Not Churn"
    }))

except Exception as e:
    print(json.dumps({
        "status": "error",
        "message": str(e)
    }))