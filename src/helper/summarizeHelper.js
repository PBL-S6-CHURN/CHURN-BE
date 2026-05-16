'use strict';

const csv  = require('csv-parser');
const fs   = require('fs');
const path = require('path');

// ── Lokasi CSV — taruh file dataset di folder ini ────────────────────────────
// Struktur: ml_models/sentiment_nlp/dataset.csv
const CSV_PATH = path.join(__dirname, '../../ml_models/sentiment_nlp/review_myim3.csv');


// ── Label sentimen dari score — identik dengan logika di Colab ───────────────
function labelSentimen(score) {
    const s = parseInt(score) || 0;
    if (s >= 4) return 'Positif';
    if (s <= 2) return 'Negatif';
    return 'Netral';
}


// ── Buat 1 paragraf ringkasan dari kumpulan review ───────────────────────────
// Ambil 5 review dengan thumbsUpCount tertinggi, gabung jadi 1 paragraf
function buildParagraph(reviews, maxChar = 600) {
    const sorted = [...reviews]
        .sort((a, b) => b.thumbsUpCount - a.thumbsUpCount)
        .slice(0, 5)
        .map(r => r.content)
        .filter(Boolean)
        .join(' ');

    if (!sorted) return '(Tidak ada data ulasan untuk kategori ini.)';
    return sorted.length > maxChar
        ? sorted.slice(0, maxChar).trimEnd() + '...'
        : sorted;
}


// ── Fungsi utama — baca CSV dan kembalikan semua data Summarize ──────────────
function getSummarizeData() {
    return new Promise((resolve, reject) => {

        // Cek dulu apakah file ada
        if (!fs.existsSync(CSV_PATH)) {
            return reject(new Error(
                `File CSV tidak ditemukan di: ${CSV_PATH}. ` +
                `Pastikan kamu sudah menaruh dataset.csv di folder ml_models/sentiment_nlp/`
            ));
        }

        const rows = [];

        fs.createReadStream(CSV_PATH)
            .pipe(csv())
            .on('data', (row) => {
                const score        = parseInt(row.score)        || 0;
                const thumbsUpCount = parseInt(row.thumbsUpCount) || 0;

                rows.push({
                    userName:    row.userName    || 'Pengguna',
                    userImage:   row.userImage   || null,
                    content:     row.content     || '',
                    score,
                    thumbsUpCount,
                    sentiment:   labelSentimen(score),
                    at:          row.at          || null,
                });
            })
            .on('end', () => {

                // ── 1. Hitung persentase (exclude Netral, sesuai notebook) ──
                const positifRows = rows.filter(r => r.sentiment === 'Positif');
                const negatifRows = rows.filter(r => r.sentiment === 'Negatif');
                const totalBinary = positifRows.length + negatifRows.length;

                const positifPct = totalBinary > 0
                    ? Math.round((positifRows.length / totalBinary) * 100)
                    : 0;
                const negatifPct = totalBinary > 0
                    ? Math.round((negatifRows.length / totalBinary) * 100)
                    : 0;

                // ── 2. Paragraf summarize ─────────────────────────────────
                const summaryPositif = buildParagraph(positifRows);
                const summaryNegatif = buildParagraph(negatifRows);

                // ── 3. Top 5 comment by thumbsUpCount (semua sentimen) ────
                const top5 = [...rows]
                    .sort((a, b) => b.thumbsUpCount - a.thumbsUpCount)
                    .slice(0, 5)
                    .map(r => ({
                        userName:     r.userName,
                        userImage:    r.userImage,
                        content:      r.content,
                        score:        r.score,
                        thumbsUpCount: r.thumbsUpCount,
                        sentiment:    r.sentiment,
                    }));

                resolve({
                    percentage: {
                        positif:       positifPct,
                        negatif:       negatifPct,
                        total_reviews: rows.length,
                    },
                    summary: {
                        positif: summaryPositif,
                        negatif: summaryNegatif,
                    },
                    top5Comments: top5,
                });
            })
            .on('error', (err) => {
                reject(new Error(`Gagal membaca CSV: ${err.message}`));
            });
    });
}

module.exports = { getSummarizeData };