"use strict";

// import file
const { UserModel } = require("../model/UserModel");
const { UserValidator } = require("../validator/users");
const { ClientError } = require('../exceptions/ClientError');
const fs = require('fs');
const path = require('path');
const { hasPassword, verifyPassword } = require("../helper/passEncrypt");

class UserController {
    static async RegisterController(req, res) {
        try {
            UserValidator.validateRegisterPayload(req.body);
            const { username, email, password } = req.body;

            const result = await UserModel.RegisterModel(username, email, password);
            
            res.status(201).json({
                status: "success",
                data: {
                    message: result
                },
            })
        } catch (error) {
            // Cek apakah ini error yang kita buat sendiri (400/401)
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({
                    status: 'fail',
                    message: error.message,
                });
            }

            // Jika bukan (misal error database/server crash), kirim status 500
            console.error(error); // Tetap log untuk internal
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kegagalan pada server kami',
            });
        }
    }

    static async LoginController(req, res) {        
        try {
            UserValidator.validateLoginPayload(req.body);
            const { email, password } = req.body;

            const result = await UserModel.LoginModel(email, password);

            if (result) {
                return res.status(200).json({
                    status: "success",
                    data: result,
                })
            }

        } catch (error) {
            // Cek apakah ini error yang kita buat sendiri (400/401)
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({
                    status: 'fail',
                    message: error.message,
                });
            }

            // Jika bukan (misal error database/server crash), kirim status 500
            console.error(error); // Tetap log untuk internal
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kegagalan pada server kami',
            });
        }
    }

    static async RefreshTokenController(req, res) {
        const { refreshToken } = req.body;

        try {
            const user = await UserModel.FindUserByRefreshToken(refreshToken);
            if (!user) {
                return res.status(403).json({ status: 'fail', message: 'Invalid refresh token' });
            }

            // 2. Verifikasi token secara JWT
            const decoded = require('../helper/tokenManager').verifyRefreshToken(refreshToken);
            if (!decoded) {
                return res.status(403).json({ status: 'fail', message: 'Token expired or invalid' });
            }

            const newAccessToken = require('../helper/tokenManager').generateAccessToken({ id: user.id });

            res.status(200).json({
                status: "success",
                data: {
                    accessToken: newAccessToken
                }
            });
        } catch (error) {
            // Cek apakah ini error yang kita buat sendiri (400/401)
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({
                    status: 'fail',
                    message: error.message,
                });
            }

            // Jika bukan (misal error database/server crash), kirim status 500
            console.error(error); // Tetap log untuk internal
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kegagalan pada server kami',
            });
        }
    }

    static async ProfileController(req, res) {
        const { user } = req;
        try {
            const result = await UserModel.ProfileModel(user.id);
            
            res.json({
                status: "success",
                data: {
                    message: result
                },
            })
        } catch (error) {
            // Cek apakah ini error yang kita buat sendiri (400/401)
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({
                    status: 'fail',
                    message: error.message,
                });
            }

            // Jika bukan (misal error database/server crash), kirim status 500
            console.error(error); // Tetap log untuk internal
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kegagalan pada server kami',
            });
        }
    }

    static async LogoutController(req, res) {
        const { refreshToken } = req.body;

        try {
            await UserModel.DeleteRefreshToken(refreshToken);
            res.status(200).json({ status: "success", message: "Logout success" });
        } catch (error) {
            // Cek apakah ini error yang kita buat sendiri (400/401)
            if (error instanceof ClientError) {
                return res.status(error.statusCode).json({
                    status: 'fail',
                    message: error.message,
                });
            }

            // Jika bukan (misal error database/server crash), kirim status 500
            console.error(error); // Tetap log untuk internal
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kegagalan pada server kami',
            });
        }
    }

    static async UpdateProfileController(req, res) {
        try {
            UserValidator.validateUpdateProfilePayload(req.body, req.file);
            const userId = req.user.id;
            const { username, email } = req.body;

            if(!username || !email) {
                return res.status(400).json({ status: "fail", message: "Username dan email tidak boleh kosong" });
            }

            const user = await UserModel.ProfileModel(userId);

            if (!user) {
                return res.status(404).json({ status: "fail", message: "User not found" });
            }

            let relativePath = null;

            if (req.file) {
                relativePath = `uploads/profile_pictures/${req.file.filename}`;

                // Hapus file foto lama di folder lokal agar tidak menimbun sampah storage
                if (user.profile_image) {
                    const oldPath = path.join(__dirname, `../../${user.profile_image}`);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
            }

            const updateUser = await UserModel.UpdateProfileModel(userId, email, username, relativePath || user.profile_image);

            return res.status(200).json({
                status: "success",
                message: "Profil Anda berhasil diperbarui",
                data: updateUser
            });
        } catch (err) {
            console.error(err);

            // Handle error custom jika email ternyata duplikat
            if (err.message === "Email sudah digunakan oleh akun lain") {
                return res.status(400).json({ status: "fail", message: err.message });
            }
            return res.status(500).json({ status: "err", message: "Gagal memperbarui profil" });
        }
    }

    static async ChangePasswordController(req, res) {
        try {
            UserValidator.validateChangePasswordPayload(req.body);
            const userId = req.user.id;
            const { oldPassword, newPassword } = req.body;

            const user = await UserModel.ProfileModel(userId);

            if (!user) {
                return res.status(404).json({ status: "fail", message: "User not found" });
            }

            const isPasswordMatch = await verifyPassword(oldPassword, user.password);

            if (!isPasswordMatch) {
                return res.status(400).json({ status: "fail", message: "Password lama salah" });
            }

            // Hash password baru sebelum disimpan ke DB
            const hashedNewPassword = await hasPassword(newPassword);

            await UserModel.UpdatePassword(userId, hashedNewPassword);

            return res.status(200).json({
                status: "success",
                message: "Password berhasil diganti"
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ status: "error", message: "Gagal mengganti password" });
        }
    }
}

module.exports = { UserController };