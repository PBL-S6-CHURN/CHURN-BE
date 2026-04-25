const { verifyAccessToken } = require("../helper/tokenManager");
const { UserModel } = require("../model/UserModel");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            status: 'fail', 
            message: 'Access denied. No token provided.' 
        });
    }

    const accessToken = authHeader.split(' ')[1];

    try {
        const decoded = verifyAccessToken(accessToken);

        if (!decoded) {
            return res.status(403).json({ 
                status: 'fail', 
                message: 'Invalid or expired access token.' 
            });
        }
        req.user = decoded; // Menyimpan payload token ke req.user
        next();
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = { authMiddleware };
