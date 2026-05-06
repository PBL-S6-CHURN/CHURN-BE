"use strict";

// import file
const { UserModel } = require("../model/UserModel");
const { UserValidator } = require("../validator/users");
const { ClientError } = require('../exceptions/ClientError');

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
}

module.exports = { UserController };