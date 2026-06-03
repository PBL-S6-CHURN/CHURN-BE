import sys
import os
from flask import Flask
from flask_cors import CORS

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from py_server.routes.summarize_router import summarize_bp
from py_server.routes.sentiment_router import sentiment_bp 
from py_server.routes.churn_router import churn_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(summarize_bp, url_prefix='/summarize')
app.register_blueprint(sentiment_bp, url_prefix='/sentiment') 
app.register_blueprint(churn_bp, url_prefix='/churn') 

if __name__ == '__main__':
    print("Mulai menjalankan Server Python di port 5000...")
    app.run(host='0.0.0.0', port=5001, debug=True)