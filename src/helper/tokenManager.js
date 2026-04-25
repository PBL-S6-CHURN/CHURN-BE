'use strict';

const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.SECRET_KEY, {expiresIn: '1d'});
};

const verifyAccessToken = async (token) => {
    try {
        return jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
        return null;
    }
};

module.exports = { generateAccessToken, verifyAccessToken };