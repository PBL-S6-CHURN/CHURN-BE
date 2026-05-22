import sys
import json
import os
import warnings

warnings.filterwarnings("ignore")

def main():
    debug_info = "Memulai skrip..."
    try:
        debug_info = "Mencoba import library utama..."
        import joblib
        import pandas as pd

        debug_info = "Mengecek file model .pkl..."
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        MODEL_PATH = os.path.join(BASE_DIR, 'churn_model.pkl')

        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model pkl tidak ditemukan di: {MODEL_PATH}")

        model = joblib.load(MODEL_PATH)

        debug_info = "Membaca data dari stdin Node.js..."
        input_json = sys.stdin.read().strip()
        if not input_json:
            raise ValueError("Data kosong! Stdin tidak menerima input apa pun.")
        
        data_dict = json.loads(input_json)
        df_raw = pd.DataFrame([data_dict])
        
        feature_names = [
            "total_users", 
            "monthly_usage_hrs", 
            "feature_adoption_pct", 
            "support_tickets_last_90d", 
            "nps_score", 
            "tenure_months", 
            "last_login_days_ago"
        ]
        
        if "support_tickets_count" in df_raw.columns and "support_tickets_last_90d" not in df_raw.columns:
            df_raw["support_tickets_last_90d"] = df_raw["support_tickets_count"]

        for col in feature_names:
            if col not in df_raw.columns:
                df_raw[col] = 0
            if col in ["total_users", "support_tickets_last_90d", "nps_score", "tenure_months", "last_login_days_ago"]:
                df_raw[col] = pd.to_numeric(df_raw[col]).astype(int)
            else:
                df_raw[col] = pd.to_numeric(df_raw[col]).astype(float)

        df_filtered = df_raw[feature_names]
        
        debug_info = "Melakukan eksekusi model.predict()..."
        prediction_raw = model.predict(df_filtered)[0]
        prediction_result = int(prediction_raw) if hasattr(prediction_raw, "item") else prediction_raw

        # Ambil variabel kunci untuk hitung skor dan faktor churn
        tickets = int(df_filtered["support_tickets_last_90d"].iloc[0])
        nps = int(df_filtered["nps_score"].iloc[0])
        last_login = int(df_filtered["last_login_days_ago"].iloc[0])
        usage = float(df_filtered["monthly_usage_hrs"].iloc[0])

        # --- TAHAP 1: HITUNG SKOR RISIKO DINAMIS ---
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

        # --- TAHAP 2: DETEKSI CHURN FACTOR & SOLUSI SECARA DINAMIS ---
        churn_factors = []
        solutions = []

        # Deteksi berdasarkan indikator data pelanggan
        if last_login > 30:
            churn_factors.append(f"Pelanggan tidak aktif (Login terakhir {last_login} hari yang lalu)")
            solutions.append("Kirimkan email re-engagement otomatis atau berikan promo khusus aktifkan kembali akun.")
        
        if tickets > 5:
            churn_factors.append(f"Jumlah komplain terlalu tinggi ({tickets} tiket dalam 90 hari terakhir)")
            solutions.append("Tugaskan tim Customer Success untuk menghubungi pelanggan secara personal dan menyelesaikan masalah teknis mereka.")
            
        if nps < 5:
            churn_factors.append(f"Tingkat kepuasan sangat rendah (Skor NPS: {nps}/10)")
            solutions.append("Lakukan survei mendalam untuk mencari tahu poin kekecewaan utama pelanggan terhadap produk.")

        if usage < 15.0:
            churn_factors.append(f"Tingkat adopsi produk rendah (Penggunaan bulanan hanya {usage} jam)")
            solutions.append("Berikan panduan (tutorial/webinar) gratis mengenai fitur-fitur unggulan agar mereka lebih merasakan manfaat aplikasi.")

        # Jika pelanggan masuk kategori aman dan tidak ada masalah terdeteksi
        if not churn_factors:
            churn_factors.append("Tidak ada faktor risiko kritis yang terdeteksi.")
            solutions.append("Pertahankan kualitas layanan dan tawarkan program loyalitas/diskon perpanjangan kontrak.")

        # Cetak JSON akhir untuk ditangkap Node.js
        print(json.dumps({
            "status": "success",
            "score": prediction_result,
            "risk_score_pct": risk_score_pct,
            "risk_level": risk_level,
            "churn_status": churn_status,
            "churn_factors": churn_factors,
            "solutions": solutions
        }))

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e),
            "titik_gagal": debug_info,
            "score": -1,
            "risk_level": "Error",
            "churn_status": "Unknown",
            "churn_factors": [],
            "solutions": []
        }))

if __name__ == '__main__':
    main()