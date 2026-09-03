const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

/**
 * Helmet Security Middleware Configuration
 * Configured with permissible CSP for Google Fonts, Chart.js CDN, and Swagger UI
 */
const helmetSecurity = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "blob:"
            ],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false
});

/**
 * General API Rate Limiter
 * 300 requests per 15 minutes window
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP address. Please try again in 15 minutes."
    }
});

/**
 * Sensitive Mutating Operations Limiter
 * 50 student write operations (POST, PUT, DELETE) per 15 minutes window
 */
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many write requests. Please try again in 15 minutes."
    }
});

module.exports = {
    helmetSecurity,
    apiLimiter,
    writeLimiter
};
