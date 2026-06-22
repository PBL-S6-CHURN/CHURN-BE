from flask import Blueprint, request, jsonify
from py_server.controllers.churn_controller import predict_churn_logic, get_churn_chart_from_db

churn_bp = Blueprint('churn_bp', __name__)

@churn_bp.route('/predict', methods=['POST'])
def predict_churn():
    try:
        # 1. Ambil JSON dari request
        data = request.get_json(force=True)

        # 2. Validasi minimal: pastikan data tidak kosong
        if not data:
            return jsonify({"status": "error", "message": "Data JSON kosong atau tidak valid"}), 400
        
        # 3. Panggil logic prediksi
        result = predict_churn_logic(data)

        # 4. Berikan response
        return jsonify(result), 200

    except Exception as e:
        print(f"[PredictRouter] Error: {str(e)}")
        import traceback
        traceback.print_exc() # Agar detail error muncul di terminal Flask
        return jsonify({"status": "error", "message": str(e)}), 500
    
@churn_bp.route('/churn-chart', methods=['GET'])
def churn_chart_endpoint():
    result = get_churn_chart_from_db()
    
    if result["status"] == "success":
        return jsonify(result), 200
    else:
        return jsonify(result), 500