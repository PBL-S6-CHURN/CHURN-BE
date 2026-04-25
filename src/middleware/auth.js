'use strict';

const webToken = require('jsonwebtoken');

class Auth { 
    static authenticate(req, res, next) {
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        webToken.verify(token, process.env.SECRET_KEY, (err, decoded) => {

            if (err) {

                if(err.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Token Expired' });
                }
                
                return res.status(401).json({ message: 'Unauthorized' });
            }

            req.user = decoded;
            next();
        });
    }
};

module.exports = { Auth };