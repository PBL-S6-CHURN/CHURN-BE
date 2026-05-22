from flask import Blueprint, jsonify
from py_server.controllers.summarize_controller import get_summarize_data

summarize_bp = Blueprint('summarize_bp', __name__)

@summarize_bp.route('/', methods=['GET'])
def get_all_summarize():
    try:
        data = get_summarize_data()
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@summarize_bp.route('/ratings', methods=['GET'])
def get_ratings():
    try:
        data = get_summarize_data()
        return jsonify({"status": "success", "data": {"percentage": data["percentage"]}}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@summarize_bp.route('/sentiment', methods=['GET'])
def get_sentiment():
    try:
        data = get_summarize_data()
        return jsonify({"status": "success", "data": {"summary": data["summary"]}}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500