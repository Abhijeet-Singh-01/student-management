const pool = require("../config/db");

class HealthController {
    // GET /health
    async checkHealth(req, res) {
        try {
            const startTime = Date.now();
            await pool.query("SELECT 1");
            const dbLatency = Date.now() - startTime;

            res.json({
                status: "UP",
                timestamp: new Date().toISOString(),
                database: {
                    status: "Connected",
                    latency_ms: dbLatency
                },
                uptime_seconds: Math.floor(process.uptime()),
                memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
            });
        } catch (error) {
            res.status(503).json({
                status: "DOWN",
                timestamp: new Date().toISOString(),
                database: {
                    status: "Disconnected",
                    error: error.message
                }
            });
        }
    }
}

module.exports = new HealthController();
