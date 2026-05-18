"use strict";

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Fungsi pembungkus (wrapper) supaya folder tujuan bisa dinamis
const createUploader = (destinationFolder) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = `./uploads/${destinationFolder}`;
            // Membuat folder secara otomatis jika belum ada
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            // Menggunakan ID user (dari auth) + timestamp agar nama file unik
            const userId = req.user ? req.user.id : "anonymous";
            const uniqueSuffix = userId + "-" + Date.now();
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error("Hanya file gambar (jpg, jpeg, png) yang diperbolehkan!"));
        }
    };

    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: 2 * 1024 * 1024 } // Batas maksimal 2MB
    });
};

// Ekspor instance uploader khusus untuk foto profil
const uploadProfileImage = createUploader("profile_pictures");

module.exports = { uploadProfileImage };