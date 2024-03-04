const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            msg: 'No valid JWT token provided or Authorization header is not valid'
        });
    }

    const token = authHeader.split(' ')[1]; // Split authHeader by space and get [1] index data (JWT token)
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded) {
            req.userId = decoded.userID;
            
            next();
        }
    } catch (error) {
        return res.status(403).json({
            msg: 'Invalid or expired JWT token: ' + error.message
        });
    }
};

module.exports = {
    authMiddleware
};
