"use strict";

const { query } = require("../config");
const { AuthenticationError } = require("../exceptions/AuthenticationError");
const { NotFoundError } = require("../exceptions/NotFoundError");
const { hasPassword, verifyPassword } = require("../helper/passEncrypt");
const { generateAccessToken, generateRefreshToken } = require("../helper/tokenManager");

require('dotenv').config();
const ms = require('ms');

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
            throw new Error(error.message);
        }
    }

    // login
    static async LoginModel(email, password) { 
        try {
            const user = await this.FindUserModel(email);

            if (!user) {
                throw new NotFoundError("Kredensial yang anda berikan salah");
            }

            const match = await verifyPassword(password, user.password);

            if (!match) {
                throw new AuthenticationError("Kata sandi salah");
            }

            const accessToken = generateAccessToken({ id: user.id });
            const refreshToken = generateRefreshToken({ id: user.id });
            const duration = ms(process.env.REFRESH_TOKEN_EXPIRATION) || "7d";
            const expired = new Date(Date.now() + duration);
            await this.saveRefreshToken(user.id, refreshToken, expired);

            return {
                accessToken,
                refreshToken,
                message: "login success"
            }
        } catch (error) {
            console.log(error.message);
            throw error;
        }
    }

    // save refresh token
    static async saveRefreshToken(id, token, expired) {
        const textQuery = `UPDATE users SET refresh_token = $1, refresh_token_expires_at = $2 WHERE id = $3;`;
        try {
            const result = await query(textQuery, [token, expired, id]);
            return true;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // find user by refresh token
    static async FindUserByRefreshToken(token) {
        const textQuery = `SELECT * FROM users WHERE refresh_token = $1;`;
        try {
            const result = await query(textQuery, [token]);
            return result.rows[0];
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Delete refresh token
    static async DeleteRefreshToken(token) {
        const textQuery = `UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE refresh_token = $1;`;
        try {
            const result = await query(textQuery, [token]);
            return true;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // show profile
    static async ProfileModel(id) {
        const textQuery = `SELECT username, email, profile_image, password FROM users WHERE id = $1`;
        try {
            const result = await query(textQuery, [id]);
            
            if (!result || result.rows.length === 0) {
                return null;
            }
            
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

    // update profile
    static async UpdateProfileModel(id, email, username, picture = null) {
        const checkEmail = await this.FindUserModel(email);

        if(checkEmail && checkEmail.id !== id) {
            throw new Error("Email sudah digunakan oleh akun lain");
        }

        let textQuery = "";
        let values = [];

        if(picture) {
            textQuery = `UPDATE users SET email = $1, username = $2, profile_image = $3 WHERE id = $4 RETURNING *;`;
            values = [email, username, picture, id];
        } else {
            textQuery = `UPDATE users SET email = $1, username = $2 WHERE id = $3 RETURNING *;`;
            values = [email, username, id];
        }

        try {
            const result = await query(textQuery, values);
            return result.rows[0];
        } catch (error) {
            console.log(error.message);
        }
    }

    // ganti pw
    static async UpdatePassword(id, hashPw) {
        const textQuery = `UPDATE users SET password = $1 WHERE id = $2 RETURNING *;`;
        try {
            const result = await query(textQuery, [hashPw, id]);
            return result.rows[0];
        } catch (error) {
            console.log(error.message);
        }
    }
}

module.exports = { UserModel };