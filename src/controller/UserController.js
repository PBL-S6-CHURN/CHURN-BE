"use strict";

const { UserModel } = require("../model/UserModel");

class UserController {
    static async RegisterController(req, res) {
        const { username, email, password } = req.body;

        try {
            const result = await UserModel.RegisterModel(username, email, password);
            
            res.status(201).json({
                status: "success",
                data: {
                    message: result
                },
            })
        } catch (error) {
            return res.status(400).json({ 
                status: 'fail',
                message: error.message 
            });
        }
    }

    static async LoginController(req, res) {
        const { email, password } = req.body;
        
        try {
            const result = await UserModel.LoginModel(email, password);
            console.log("Hasil dari UserModel:", result);

            if (result) {
                return res.status(200).json({
                    status: "success",
                    data: result,
                })
            }

        } catch (error) {
            return res.status(400).json({ 
                status: 'fail',
                message: error.message 
            });
        }
    }

    static async RefreshTokenController(req, res) {
        const { refreshToken } = req.body;

        try {
            // 1. Cari user berdasarkan refresh token di DB
            const user = await UserModel.FindUserByRefreshToken(refreshToken);
            if (!user) {
                return res.status(403).json({ status: 'fail', message: 'Invalid refresh token' });
            }

            // 2. Verifikasi token secara JWT
            const decoded = require('../helper/tokenManager').verifyRefreshToken(refreshToken);
            if (!decoded) {
                return res.status(403).json({ status: 'fail', message: 'Token expired or invalid' });
            }

            // 3. Generate Access Token baru
            const newAccessToken = require('../helper/tokenManager').generateAccessToken({ id: user.id });

            res.status(200).json({
                status: "success",
                data: {
                    accessToken: newAccessToken
                }
            });
        } catch (error) {
            return res.status(400).json({ 
                status: 'fail',
                message: error.message 
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
            return res.status(400).json({ 
                status: 'fail',
                message: error.message 
            });
        }
    }
}

module.exports = { UserController };