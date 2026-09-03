const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey_edumanage_pro_2026";

/**
 * Middleware to verify Bearer JWT token
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. Authentication token required."
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: "Invalid or expired token. Please log in again."
            });
        }
        req.user = decoded;
        next();
    });
}

/**
 * Optional authentication: attaches user if token is valid, but allows guest access
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err) {
            req.user = decoded;
        } else {
            req.user = null;
        }
        next();
    });
}

/**
 * Role-Based Access Control (RBAC) middleware
 * @param {string} role Required role (e.g. 'Admin')
 */
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        if (req.user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Requires '${role}' role privileges.`
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    optionalAuth,
    requireRole
};
