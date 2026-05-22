from flask import Blueprint, request, jsonify
from py_server.controllers.sentiment_controller import predict_sentiment_data

sentiment_bp = Blueprint('sentiment_bp', __name__)

# Gunakan metode POST, karena kita akan mengirim Body JSON
@sentiment_bp.route('/', methods=['POST'])
def predict_route():
    try:
        # Ambil JSON dari request Apidog
        data = request.get_json()
        
        # Validasi jika text tidak ada
        if not data or 'text' not in data:
            return jsonify({"status": "error", "message": "Field 'text' tidak ditemukan"}), 400
            
        text = data['text']
        result = predict_sentiment_data(text)
        
        return jsonify(result), 200
    except Exception as e:
        print(f"[PredictRouter] Error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500