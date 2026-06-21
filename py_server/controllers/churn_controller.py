import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'churn_prediction', 'churn_model.pkl')

try:
    model_data        = joblib.load(MODEL_PATH)
    pipeline          = model_data['pipeline']           # SVC probability=False → raw score
    pipeline_proba    = model_data['pipeline_proba']     # SVC probability=True  → Platt %
    expected_features = model_data['feature_names']
    medium_threshold  = model_data['medium_threshold']   # -1.0259
    high_threshold    = model_data['high_threshold']     # -0.1907
    print(f"Berhasil memuat model churn dari: {MODEL_PATH}")
except Exception as e:
    pipeline = pipeline_proba = None
    print(f"Gagal memuat model: {e}")


def predict_churn_logic(data_dict):
    if pipeline is None:
        return {"status": "error", "message": "Model .pkl tidak ditemukan di server"}

    try:
        # 1. Konversi data ke DataFrame
        df_raw = pd.DataFrame([data_dict])

        # Penyesuaian nama kolom (jika frontend beda)
        if "support_ticket_last_90d" in df_raw.columns:
            df_raw["support_tickets_last_90d"] = df_raw["support_ticket_last_90d"]
        elif "support_tickets_count" in df_raw.columns:
            df_raw["support_tickets_last_90d"] = df_raw["support_tickets_count"]

        # 2. Lengkapi & urutkan fitur sesuai training
        for col in expected_features:
            if col not in df_raw.columns:
                df_raw[col] = 0.0
        for col in expected_features:
            df_raw[col] = pd.to_numeric(df_raw[col], errors='coerce').fillna(0)

        df_filtered = df_raw[expected_features]

        # 3a. RAW SCORE — jarak ke hyperplane SVM (bisa negatif / > 1)
        #     Range aktual data: [-2.7750, 2.2254] — tidak ada clamping
        raw_score = float(pipeline.decision_function(df_filtered)[0])

        # 3b. PLATT PROBABILITY — probabilitas churn 0–100% (Platt Scaling)
        #     Lebih mudah dibaca stakeholder
        platt_pct = round(float(pipeline_proba.predict_proba(df_filtered)[0][1]) * 100, 2)

        # 4. Binary prediction dari raw score (threshold SVM default = 0)
        prediction_result = 1 if raw_score > 0 else 0
        churn_status = "YES" if prediction_result == 1 else "NO"

        # 5. Risk Level dari raw score (data-driven threshold dari PR Curve)
        #    medium_threshold = -1.0259  (Recall >= 90%: early warning)
        #    high_threshold   = -0.1907  (Recall >= 50%: sangat rawan)
        if raw_score >= high_threshold:       # >= -0.1907
            risk_level = "HIGH"
        elif raw_score >= medium_threshold:   # >= -1.0259 dan < -0.1907
            risk_level = "MEDIUM"
        else:                                 # < -1.0259
            risk_level = "LOW"

        # 6. Faktor & Solusi
        tickets    = int(df_filtered["support_tickets_last_90d"].iloc[0])
        nps        = int(df_filtered["nps_score"].iloc[0])
        last_login = int(df_filtered["last_login_days_ago"].iloc[0])
        usage      = float(df_filtered["monthly_usage_hrs"].iloc[0])

        churn_factors = []
        solutions     = []

        if last_login > 30:
            churn_factors.append(f"Pelanggan tidak aktif (Login terakhir {last_login} hari yang lalu)")
            solutions.append("Kirimkan email re-engagement otomatis.")
        if tickets > 5:
            churn_factors.append(f"Jumlah komplain terlalu tinggi ({tickets} tiket)")
            solutions.append("Tugaskan tim Customer Success untuk follow-up personal.")
        if nps < 5:
            churn_factors.append(f"Tingkat kepuasan rendah (Skor NPS: {nps}/10)")
            solutions.append("Lakukan survei kepuasan mendalam.")
        if usage < 15.0:
            churn_factors.append(f"Adopsi produk rendah ({usage} jam/bulan)")
            solutions.append("Berikan tutorial fitur unggulan.")

        if not churn_factors:
            churn_factors.append("Tidak ada faktor risiko kritis.")
            solutions.append("Tawarkan program loyalitas.")

        return {
            "status"          : "success",
            "score"           : prediction_result,          # 0 atau 1
            "risk_score_pct"  : round(raw_score, 4),        # raw SVM score (untuk Node.js)
            "platt_score_pct" : platt_pct,                  # probabilitas churn 0–100%
            "risk_level"      : risk_level,
            "churn_status"    : churn_status,
            "churn_factors"   : churn_factors,
            "solutions"       : solutions,
            "raw_probability" : round(raw_score, 4)         # alias raw_score (backward compat)
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}