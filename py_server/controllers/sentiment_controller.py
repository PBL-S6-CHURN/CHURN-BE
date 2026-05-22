import os
import re
import numpy as np
import joblib
import warnings
import logging

warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_USE_LEGACY_KERAS'] = '1'
logging.getLogger('tensorflow').setLevel(logging.ERROR)

from tf_keras.models import load_model
from tf_keras.preprocessing.sequence import pad_sequences
from lime.lime_text import LimeTextExplainer

# Path ke root CHURN-BE
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Path ke model-model
MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'sentiment_nlp', 'sentiment_bilstm_model.h5')
TOKENIZER_PATH = os.path.join(BASE_DIR, 'ml_models', 'sentiment_nlp', 'sentiment_tokenizer.pkl')
LE_PATH = os.path.join(BASE_DIR, 'ml_models', 'sentiment_nlp', 'sentiment_label_encoder.pkl')

NEGATION_WORDS = {
    'tidak', 'tak', 'bukan', 'belum', 'jangan',
    'ga', 'gak', 'nggak', 'enggak', 'nggk', 'ngga',
    'tanpa', 'tiada', 'kurang'
}
NEGATION_SCOPE  = 2
NEGATION_SUFFIX = '_tidak'
FLIP_THRESHOLD  = 0.92

def preprocess_negation(text: str) -> str:
    tokens = text.lower().split()
    result = []
    neg_countdown = 0
    for token in tokens:
        clean = re.sub(r'[^\w]', '', token)
        if clean in NEGATION_WORDS:
            result.append(token)
            neg_countdown = NEGATION_SCOPE
        elif neg_countdown > 0:
            result.append(token + NEGATION_SUFFIX)
            neg_countdown -= 1
        else:
            result.append(token)
    return ' '.join(result)

def detect_negation_pattern(text: str) -> bool:
    tokens = re.findall(r'\w+', text.lower())
    for i, token in enumerate(tokens):
        if token in NEGATION_WORDS:
            scope_tokens = tokens[i + 1 : i + 1 + NEGATION_SCOPE]
            if scope_tokens: return True
    return False

def flip_sentiment(label: str) -> str:
    flip_map = {'Positif': 'Negatif', 'Negatif': 'Positif', 'positif': 'negatif', 'negatif': 'positif'}
    return flip_map.get(label, label)

def apply_negation_correction(label: str, confidence: float, text: str) -> tuple:
    has_negation  = detect_negation_pattern(text)
    was_corrected = False
    if has_negation and label not in ('Netral', 'netral', 'NETRAL'):
        if confidence < FLIP_THRESHOLD:
            label = flip_sentiment(label)
            confidence = round(confidence, 4)
            was_corrected = True
    return label, confidence, has_negation, was_corrected

def predict_sentiment_data(text):
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model tidak ditemukan di: {MODEL_PATH}")

    model         = load_model(MODEL_PATH)
    tokenizer     = joblib.load(TOKENIZER_PATH)
    label_encoder = joblib.load(LE_PATH)
    MAX_LEN = 100

    def predict_proba_wrapper(texts):
        processed = [preprocess_negation(t) for t in texts]
        seq = tokenizer.texts_to_sequences(processed)
        padded = pad_sequences(seq, maxlen=MAX_LEN, padding='post', truncating='post')
        return model.predict(padded, verbose=0)

    processed_text = preprocess_negation(text)
    seq    = tokenizer.texts_to_sequences([processed_text])
    padded = pad_sequences(seq, maxlen=MAX_LEN, padding='post', truncating='post')

    pred_prob  = model.predict(padded, verbose=0)
    pred_class = np.argmax(pred_prob, axis=1)
    raw_label  = label_encoder.inverse_transform(pred_class)[0]
    confidence = float(np.max(pred_prob))

    final_label, final_conf, negation_found, was_corrected = apply_negation_correction(
        raw_label, confidence, text
    )

    class_names = list(label_encoder.classes_)
    explainer = LimeTextExplainer(class_names=class_names)
    exp = explainer.explain_instance(text, predict_proba_wrapper, num_features=6)
    
    lime_features = []
    for word, weight in exp.as_list():
        lime_features.append({
            "kata": word,
            "bobot": round(float(weight), 4),
            "keterangan": "mendukung" if weight > 0 else "melawan"
        })

    explanation = {
        "metode": "LIME",
        "keterangan_penting": f"LIME menjelaskan mengapa model menebak '{raw_label}'. Bobot positif mendukung tebakan ini.",
        "kata_kunci": lime_features,
        "dikoreksi_oleh_sistem_negasi": was_corrected
    }

    return {
        "status": "success",
        "data": {
            "original_text":      text,
            "processed_text":     processed_text,
            "sentiment":          final_label,
            "confidence":         final_conf,
            "negation_detected":  negation_found,
            "negation_corrected": was_corrected,
            "explanation":        explanation,
            "model_raw": {
                "sentiment":  raw_label,
                "confidence": confidence
            }
        }
    }