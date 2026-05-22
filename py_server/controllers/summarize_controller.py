import os
import csv
import re
import numpy as np
import joblib
import warnings
import logging
from collections import defaultdict

warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_USE_LEGACY_KERAS'] = '1'
logging.getLogger('tensorflow').setLevel(logging.ERROR)

from tf_keras.models import load_model
from tf_keras.preprocessing.sequence import pad_sequences
from lime.lime_text import LimeTextExplainer

# ── Path Setup ────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR  = os.path.join(BASE_DIR, 'ml_models', 'sentiment_nlp')

CSV_PATH       = os.path.join(MODEL_DIR, 'review_myim3.csv')
MODEL_PATH     = os.path.join(MODEL_DIR, 'sentiment_bilstm_model.h5')
TOKENIZER_PATH = os.path.join(MODEL_DIR, 'sentiment_tokenizer.pkl')
ENCODER_PATH   = os.path.join(MODEL_DIR, 'sentiment_label_encoder.pkl')

MAX_LEN    = 100
BATCH_SIZE = 256

LABEL_MAP = {
    'positive': 'Positif',
    'neutral' : 'Netral',
    'negative': 'Negatif',
    'positif' : 'Positif',
    'netral'  : 'Netral',
    'negatif' : 'Negatif',
}

# ── Sentiment Utils Functions ─────────────────────────────────────────
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
            if scope_tokens:
                return True
    return False

def flip_sentiment(label: str) -> str:
    flip_map = {
        'Positif': 'Negatif', 'Negatif': 'Positif',
        'positif': 'negatif', 'negatif': 'positif'
    }
    return flip_map.get(label, label)

def apply_negation_correction(label: str, confidence: float, text: str) -> tuple:
    has_negation  = detect_negation_pattern(text)
    was_corrected = False
    if has_negation and label not in ('Netral', 'netral', 'NETRAL'):
        if confidence < FLIP_THRESHOLD:
            label         = flip_sentiment(label)
            confidence    = round(confidence, 4)
            was_corrected = True
    return label, confidence, has_negation, was_corrected


# ── Global Variables ──────────────────────────────────────────────────
CLASS_INDEX     = {}
_model          = None
_tokenizer      = None
_label_encoder  = None
_lime_explainer = None


# ── Load Resources ────────────────────────────────────────────────────
def _load_resources():
    global _model, _tokenizer, _label_encoder, _lime_explainer, CLASS_INDEX

    if _model is None:
        print("[SummarizeController] Loading BiLSTM model...")
        _model = load_model(MODEL_PATH)

    if _tokenizer is None:
        print("[SummarizeController] Loading tokenizer...")
        _tokenizer = joblib.load(TOKENIZER_PATH)

    if _label_encoder is None:
        print("[SummarizeController] Loading label encoder...")
        _label_encoder = joblib.load(ENCODER_PATH)
        for idx, cls in enumerate(_label_encoder.classes_):
            normalized = LABEL_MAP.get(cls.lower(), cls)
            CLASS_INDEX[normalized] = idx
        print(f"[SummarizeController] CLASS_INDEX: {CLASS_INDEX}")

    if _lime_explainer is None:
        class_names_indonesian = [
            LABEL_MAP.get(c.lower(), c) for c in _label_encoder.classes_
        ]
        _lime_explainer = LimeTextExplainer(
            class_names=class_names_indonesian,
            random_state=42
        )
        print(f"[SummarizeController] LIME ready | classes: {class_names_indonesian}")

# ── Predict proba untuk LIME (dengan negation preprocessing) ─────────
def _predict_proba(texts: list) -> np.ndarray:
    processed = [preprocess_negation(t) for t in texts]
    sequences = _tokenizer.texts_to_sequences(processed)
    padded    = pad_sequences(sequences, maxlen=MAX_LEN, padding='post', truncating='post')
    return _model.predict(padded, verbose=0)

# ── Predict batch dengan negation correction + simpan confidence ──────
def _predict_sentiments(texts: list) -> list:
    """Mengembalikan list of dict {label, confidence}"""
    _load_resources()

    processed = [preprocess_negation(t) for t in texts]
    sequences = _tokenizer.texts_to_sequences(processed)
    padded    = pad_sequences(sequences, maxlen=MAX_LEN, padding='post', truncating='post')

    all_results = []
    for i in range(0, len(padded), BATCH_SIZE):
        batch       = padded[i : i + BATCH_SIZE]
        probs       = _model.predict(batch, verbose=0)
        indices     = np.argmax(probs, axis=1)
        raw_labels  = _label_encoder.inverse_transform(indices)
        confidences = np.max(probs, axis=1)

        for j, (raw_label, conf) in enumerate(zip(raw_labels, confidences)):
            original_text = texts[i + j]
            normalized    = LABEL_MAP.get(raw_label.lower(), 'Netral')
            final_label, final_conf, _, _ = apply_negation_correction(
                normalized, float(conf), original_text
            )
            all_results.append({
                'label'     : final_label,
                'confidence': final_conf
            })

    return all_results

# ── LIME Summary Generator ────────────────────────────────────────────
def _generate_lime_summary(
    reviews     : list,
    target_label: str,
    top_reviews : int = 20,   # ← perbesar pool kandidat
    top_words   : int = 10,
    num_samples : int = 300,
    min_length  : int = 50    # ← filter review terlalu pendek
) -> str:
    if not reviews:
        return '(Tidak ada data ulasan untuk kategori ini.)'

    # Filter review pendek dulu, baru ambil top N by confidence
    filtered = [r for r in reviews if len(r['content'].strip()) >= min_length]

    # Fallback jika semua pendek
    if not filtered:
        filtered = reviews

    candidate_texts = [r['content'] for r in filtered[:top_reviews] if r['content'].strip()]

    if not candidate_texts:
        return '(Tidak ada data ulasan untuk kategori ini.)'

    target_idx = CLASS_INDEX.get(target_label)
    if target_idx is None:
        return '(Konfigurasi kelas tidak ditemukan.)'

    # Ambil 5 terbaik untuk di-LIME (hemat waktu)
    lime_candidates = candidate_texts[:5]

    word_weights = defaultdict(list)
    print(f"[LIME] Analyzing {len(lime_candidates)} reviews untuk '{target_label}'...")

    for text in lime_candidates:
        try:
            exp = _lime_explainer.explain_instance(
                text,
                _predict_proba,
                labels=[target_idx],
                num_features=20,
                num_samples=num_samples
            )
            for word, weight in exp.as_list(label=target_idx):
                if weight > 0:
                    word_weights[word.lower()].append(weight)
        except Exception as e:
            print(f"[LIME] Skip review karena error: {e}")
            continue

    if not word_weights:
        joined = ' '.join(candidate_texts[:3])
        return joined[:600].rstrip() + '...' if len(joined) > 600 else joined

    avg_weights   = {w: np.mean(v) for w, v in word_weights.items()}
    top_word_list = sorted(avg_weights.items(), key=lambda x: x[1], reverse=True)[:top_words]
    top_words_str = [w for w, _ in top_word_list]

    print(f"[LIME] Top words untuk '{target_label}': {top_words_str}")

    def relevance_score(text: str) -> int:
        t = text.lower()
        return sum(1 for w in top_words_str if w in t)

    # Pilih best_reviews dari semua candidate (bukan hanya lime_candidates)
    best_reviews   = sorted(candidate_texts, key=relevance_score, reverse=True)[:3]
    keyword_phrase = ', '.join(top_words_str[:6])

    label_description = {
        'Positif': f"Ulasan positif banyak menyoroti kata kunci: {keyword_phrase}.",
        'Netral' : f"Ulasan netral banyak menyoroti kata kunci: {keyword_phrase}.",
        'Negatif': f"Ulasan negatif banyak menyoroti kata kunci: {keyword_phrase}.",
    }

    intro        = label_description.get(target_label, f"Kata kunci dominan: {keyword_phrase}.")
    sample_parts = []
    for r in best_reviews:
        cut = r[:250].rsplit(' ', 1)[0] + '...' if len(r) > 250 else r
        sample_parts.append(cut)

    samples = ' | '.join(sample_parts)
    summary = f"{intro} Contoh ulasan: {samples}"

    max_len = 1200
    if len(summary) > max_len:
        cut = summary[:max_len]
        for punct in ['. ', '! ', '? ', ', ']:
            idx = cut.rfind(punct)
            if idx > max_len * 0.7:
                return cut[:idx + 1]
        return cut.rsplit(' ', 1)[0] + '...'

    return summary

# ── Main ──────────────────────────────────────────────────────────────
def get_summarize_data() -> dict:
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"File CSV tidak ditemukan: {CSV_PATH}")

    rows = []
    with open(CSV_PATH, mode='r', encoding='utf-8-sig', errors='replace') as file:
        reader = csv.DictReader(file)
        for row in reader:
            content = (row.get('content') or '').strip()
            if not content:
                continue

            try: thumbs_up = int(row.get('thumbsUpCount', 0))
            except ValueError: thumbs_up = 0

            rows.append({
                'userName'     : row.get('userName', 'Pengguna') or 'Pengguna',
                'userImage'    : row.get('userImage', None),
                'content'      : content,
                'thumbsUpCount': thumbs_up,
                'at'           : row.get('at', None),
                'sentiment'    : None,
                'confidence'   : 0.0
            })

    if not rows:
        raise ValueError("Tidak ada data ulasan yang valid di CSV.")

    print(f"[SummarizeController] Memprediksi {len(rows)} ulasan...")
    texts   = [r['content'] for r in rows]
    results = _predict_sentiments(texts)

    for row, res in zip(rows, results):
        row['sentiment']  = res['label']
        row['confidence'] = res['confidence']

    # --- FILTER SARKASME MULAI DI SINI ---
    sarcasm_keywords = [
        'korup', 'mahal', 'jelek', 'wkwk', 'nyesel', 'rugi', 'anjing', 'anjg', 'bangsat',
        'hancur', 'bapuk', 'parah', 'lemot', 'lelet', 'ilang', 'buruk', 'lambat', 'gagal', 'legend'
    ]

    def is_sarcastic(text):
        text_lower = text.lower()
        return any(word in text_lower for word in sarcasm_keywords)

    positif_rows = []
    netral_rows  = []
    negatif_rows = []

    for r in rows:
        # Jika model memprediksi Positif atau Netral tapi mengandung kata kasar/negatif, paksa pindah ke Negatif
        if r['sentiment'] in ['Positif', 'Netral']:
            if is_sarcastic(r['content']):
                r['sentiment'] = 'Negatif'
                r['confidence'] = 0.99  # Beri confidence tinggi agar masuk analisis LIME negatif
                negatif_rows.append(r)
            else:
                if r['sentiment'] == 'Positif':
                    positif_rows.append(r)
                else:
                    netral_rows.append(r)
        elif r['sentiment'] == 'Negatif':
            negatif_rows.append(r)
    # --- FILTER SARKASME SELESAI ---

    total = len(rows)

    positif_pct = round((len(positif_rows) / total) * 100)
    netral_pct  = round((len(netral_rows)  / total) * 100)
    negatif_pct = round((len(negatif_rows) / total) * 100)
    diff        = 100 - (positif_pct + netral_pct + negatif_pct)
    
    # Koreksi pembulatan ditaruh di kategori terbanyak
    if positif_pct > negatif_pct and positif_pct > netral_pct:
        positif_pct += diff
    elif netral_pct > positif_pct and netral_pct > negatif_pct:
        netral_pct += diff
    else:
        negatif_pct += diff

    # Urutkan by confidence DESC — kandidat LIME dari review yang model paling yakin
    def by_confidence(category_rows):
        return sorted(category_rows, key=lambda x: x['confidence'], reverse=True)

    print("[SummarizeController] Generating LIME summaries...")
    summary_positif = _generate_lime_summary(by_confidence(positif_rows), 'Positif')
    summary_netral  = _generate_lime_summary(by_confidence(netral_rows),  'Netral' )
    summary_negatif = _generate_lime_summary(by_confidence(negatif_rows), 'Negatif')

    # Top 5 tetap by thumbsUpCount (komentar paling populer)
    all_sorted   = sorted(rows, key=lambda x: x['thumbsUpCount'], reverse=True)
    top5_cleaned = [{
        'userName'     : r['userName'],
        'userImage'    : r['userImage'],
        'content'      : r['content'],
        'thumbsUpCount': r['thumbsUpCount'],
        'sentiment'    : r['sentiment'],
    } for r in all_sorted[:5]]

    return {
        "percentage": {
            "positif"      : positif_pct,
            "netral"       : netral_pct,
            "negatif"      : negatif_pct,
            "total_reviews": total,
        },
        "summary": {
            "positif": summary_positif,
            "netral" : summary_netral,
            "negatif": summary_negatif,
        },
        "top5Comments": top5_cleaned,
    }

