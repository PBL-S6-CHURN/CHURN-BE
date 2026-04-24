"use strict";

class UserController {
    static async RegisterController(req, res) {
        try {
            const {username, email, password} = req.body;
            res.send(`Register: ${username}, ${email}, ${password}`);
        } catch (error) {
            console.log(error);
        }
    }

    static async LoginController(req, res) {
        try {
            const {email, password} = req.body;
            res.send(`Login : ${email}, ${password}`);
        } catch (error) {
            console.log(error);
        }
    }

    static async ProfileController(req, res) {
        try {
            res.send(`Lihat Profile`);
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = { UserController };