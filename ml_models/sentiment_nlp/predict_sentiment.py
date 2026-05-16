import sys
import json
import numpy as np
import joblib
import os
import warnings
import logging

# Wajib sama persis seperti di Colab
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_USE_LEGACY_KERAS'] = '1'
logging.getLogger('tensorflow').setLevel(logging.ERROR)

from tf_keras.models import load_model
from tf_keras.preprocessing.sequence import pad_sequences

def predict(text):
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))

        # Pakai .h5 sekarang
        model_path     = os.path.join(base_dir, 'sentiment_bilstm_model.h5')
        tokenizer_path = os.path.join(base_dir, 'sentiment_tokenizer.pkl')
        le_path        = os.path.join(base_dir, 'sentiment_label_encoder.pkl')

        model         = load_model(model_path)
        tokenizer     = joblib.load(tokenizer_path)
        label_encoder = joblib.load(le_path)

        MAX_LEN = 100
        seq     = tokenizer.texts_to_sequences([text])
        padded  = pad_sequences(seq, maxlen=MAX_LEN, padding='post', truncating='post')

        pred_prob  = model.predict(padded, verbose=0)
        pred_class = np.argmax(pred_prob, axis=1)
        label      = label_encoder.inverse_transform(pred_class)[0]

        print(json.dumps({
            "original_text": text,
            "sentiment":     label,
            "confidence":    float(np.max(pred_prob))
        }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        predict(sys.argv[1])
    else:
        print(json.dumps({"error": "Teks tidak diberikan"}))