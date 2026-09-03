const authService = require("../services/authService");

class AuthController {
    /**
     * User registration
     */
    async register(req, res, next) {
        try {
            const { username, email, password, role } = req.body;
            const newUser = await authService.register({ username, email, password, role });

            res.status(201).json({
                success: true,
                message: "User account registered successfully.",
                data: newUser
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * User login
     */
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const authResult = await authService.login({ username, password });

            res.status(200).json({
                success: true,
                message: "Login successful.",
                token: authResult.token,
                user: authResult.user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user profile
     */
    async getMe(req, res, next) {
        try {
            const user = await authService.getUserById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
