const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey_edumanage_pro_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

class AuthService {
    /**
     * Registers a new user account
     */
    async register({ username, email, password, role = "Student" }) {
        if (!username || !email || !password) {
            const err = new Error("Username, email, and password are required.");
            err.statusCode = 400;
            throw err;
        }

        if (password.length < 6) {
            const err = new Error("Password must be at least 6 characters long.");
            err.statusCode = 400;
            throw err;
        }

        // Validate role
        const validRoles = ["Admin", "Student"];
        const assignedRole = validRoles.includes(role) ? role : "Student";

        const passwordHash = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (username, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, role, created_at;
        `;
        const result = await pool.query(query, [username.trim(), email.trim().toLowerCase(), passwordHash, assignedRole]);
        return result.rows[0];
    }

    /**
     * Authenticates a user and returns a signed JWT token
     */
    async login({ username, password }) {
        if (!username || !password) {
            const err = new Error("Username/email and password are required.");
            err.statusCode = 400;
            throw err;
        }

        const query = `
            SELECT id, username, email, password_hash, role, created_at
            FROM users
            WHERE username = $1 OR email = $1;
        `;
        const result = await pool.query(query, [username.trim()]);
        const user = result.rows[0];

        if (!user) {
            const err = new Error("Invalid username or password.");
            err.statusCode = 401;
            throw err;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            const err = new Error("Invalid username or password.");
            err.statusCode = 401;
            throw err;
        }

        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return {
            token,
            user: payload
        };
    }

    /**
     * Fetches user profile by ID
     */
    async getUserById(id) {
        const query = `
            SELECT id, username, email, role, created_at
            FROM users
            WHERE id = $1;
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }
}

module.exports = new AuthService();
