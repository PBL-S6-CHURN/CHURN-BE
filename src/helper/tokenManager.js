'use strict';

const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION });
};

const generateRefreshToken = (payload, secret = process.env.REFRESH_TOKEN_SECRET, expiresIn = process.env.REFRESH_TOKEN_EXPIRATION) => {
    return jwt.sign(payload, secret, { expiresIn });
};


const verifyAccessToken = async (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    }
    catch (err) {
        return null;
    }
};
const verifyRefreshToken = (token) => verifyAccessToken(token, process.env.REFRESH_TOKEN_SECRET);

module.exports = { generateAccessToken, verifyAccessToken, verifyToken, generateRefreshToken, verifyRefreshToken };