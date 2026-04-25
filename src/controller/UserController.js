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
            console.log(result);
            if (result.user) {
                res.status(200).json({
                    status: "success",
                    data: {
                        message: result.message,
                        accessToken: result.accessToken
                    },
                })
            }

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