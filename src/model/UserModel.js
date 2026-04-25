"use strict";

const { query } = require("../config");
const webToken = require("jsonwebtoken");
const { hasPassword, verifyPassword } = require("../helper/passEncrypt");
const { generateAccessToken } = require("../helper/tokenManager");

class UserModel {
    constructor(username, email) {
        this.username = username;
        this.email = email;
    }

    // register
    static async RegisterModel(username, email, password) {
        const textQuery = `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *`;

        try {
            const hashPass = await hasPassword(password);
            const result = await query(textQuery, [username, email, hashPass]);

            if(result) {
                return "user created";
            }
        } catch (error) {
            console.log(error.message);
        }
    }

    // login
    static async LoginModel(email, password) { 
        try {
            const user = await this.FindUserModel(email);

            if (!user) {
                return "user not found";
            }

            const match = await verifyPassword(password, user.password);

            if (!match) {
                return "wrong password";
            }

            const accessToken = generateAccessToken({ id: user.id });


            return {
                user: true,
                match,
                accessToken,
                message: "login success"
            }
        } catch (error) {
            console.log(error.message);
        }
    }

    // show profile
    static async ProfileModel(id) {
        const textQuery = `SELECT username, email FROM users WHERE id = $1`;
        try {
            const result = await query(textQuery, [id]);
            return result.rows[0];
        } catch (error) {
            console.log(error.message);
        }
    }

    // findUser by email
    static async FindUserModel(email) {
        const textQuery = `SELECT * FROM users WHERE email = $1`;
        try {
            const result = await query(textQuery, [email]);
            return result.rows[0];
        } catch (error) {
            console.log(error.message);
        }
    }
}

module.exports = { UserModel };