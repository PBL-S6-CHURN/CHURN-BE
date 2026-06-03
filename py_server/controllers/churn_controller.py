import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'churn_prediction', 'churn_model.pkl')

try: 
    model = joblib.load(MODEL_PATH)
    print(f"Berhasil memuat model churn dari: {MODEL_PATH}")
except FileNotFoundError:
    raise FileNotFoundError(f"Model pkl tidak ditemukan di: {MODEL_PATH}")

def predict_churn_logic(data_dict):
    if model is None:
        return {"status": "error", "message": "Model .pkl tidak ditemukan di server"}

    try:
        # 1. Konversi data ke DataFrame
        df_raw = pd.DataFrame([data_dict])
        
        # 2. Samakan Fitur (Sesuai kode predict.py Anda)
        feature_names = [
            "total_users", 
            "monthly_usage_hrs", 
            "feature_adoption_pct", 
            "support_tickets_last_90d", 
            "nps_score", 
            "tenure_months", 
            "last_login_days_ago"
        ]
        
        # Handling alias kolom
        if "support_ticket_last_90d" in df_raw.columns:
            df_raw["support_tickets_last_90d"] = df_raw["support_ticket_last_90d"]
        elif "support_tickets_count" in df_raw.columns:
            df_raw["support_tickets_last_90d"] = df_raw["support_tickets_count"]

        # Fill missing & Type casting
        for col in feature_names:
            if col not in df_raw.columns:
                df_raw[col] = 0
            
            if col in ["total_users", "support_tickets_last_90d", "nps_score", "tenure_months", "last_login_days_ago"]:
                df_raw[col] = pd.to_numeric(df_raw[col], errors='coerce').fillna(0).astype(int)
            else:
                df_raw[col] = pd.to_numeric(df_raw[col], errors='coerce').fillna(0).astype(float)

        df_filtered = df_raw[feature_names]
        
        # 3. Eksekusi Model
        prediction_raw = model.predict(df_filtered.values)[0]
        prediction_result = int(prediction_raw)

        # 4. Ambil variabel untuk hitung skor risiko (Logika Dinamis Anda)
        tickets = int(df_filtered["support_tickets_last_90d"].iloc[0])
        nps = int(df_filtered["nps_score"].iloc[0])
        last_login = int(df_filtered["last_login_days_ago"].iloc[0])
        usage = float(df_filtered["monthly_usage_hrs"].iloc[0])

        # --- HITUNG SKOR RISIKO ---
        if prediction_result == 1:
            churn_status = "YES"
            risk_level = "HIGH"
            bonus_pinalti = (tickets * 2) + (last_login // 5) + (10 - nps)
            risk_score_pct = min(66 + bonus_pinalti, 100)
        else:
            churn_status = "NO"
            stres_poin = 0
            if tickets > 5: stres_poin += 20
            if nps < 5: stres_poin += 20
            if last_login > 30: stres_poin += 15
            
            variasi = (tickets * 2) + (last_login // 10)
            total_skor = stres_poin + variasi
            if total_skor > 30:
                risk_level = "MEDIUM"
                risk_score_pct = max(31, min(total_skor, 65))
            else:
                risk_level = "LOW"
                risk_score_pct = max(5, min(total_skor, 30))

        # --- FAKTOR & SOLUSI ---
        churn_factors = []
        solutions = []

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
            "status": "success",
            "score": prediction_result,
            "risk_score_pct": int(risk_score_pct),
            "risk_level": risk_level,
            "churn_status": churn_status,
            "churn_factors": churn_factors,
            "solutions": solutions
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}