'use strict';

const bcrypt = require('bcrypt');

const hasPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        console.log(error.message);
    }
}

const verifyPassword = async (password, hash) => {
    try {
        const result = await bcrypt.compare(password, hash);
        return result;
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = { hasPassword, verifyPassword };