const { createClient } = require("redis");

class CacheService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.enabled = process.env.CACHE_ENABLED !== "false";
        this.defaultTTL = parseInt(process.env.CACHE_TTL, 10) || 300; // 5 minutes default

        if (this.enabled) {
            this.initClient();
        }
    }

    initClient() {
        const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";

        try {
            this.client = createClient({
                url,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 5) {
                            return new Error("Redis retry connection limit reached");
                        }
                        return Math.min(retries * 500, 3000);
                    }
                }
            });

            this.client.on("connect", () => {
                // Connection initiated
            });

            this.client.on("ready", () => {
                this.isReady = true;
                console.log("⚡ Redis cache connected and ready.");
            });

            this.client.on("error", (err) => {
                // Graceful fallback: don't crash the server if Redis goes down
                this.isReady = false;
            });

            this.client.on("end", () => {
                this.isReady = false;
            });

            // Connect asynchronously without blocking application boot
            this.client.connect().catch(() => {
                this.isReady = false;
            });
        } catch (err) {
            this.isReady = false;
        }
    }

    /**
     * Retrieves an item from cache
     */
    async get(key) {
        if (!this.isReady || !this.client) return null;
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            return null;
        }
    }

    /**
     * Caches an item with a time-to-live in seconds
     */
    async set(key, value, ttlSeconds = this.defaultTTL) {
        if (!this.isReady || !this.client) return false;
        try {
            const serialized = JSON.stringify(value);
            await this.client.set(key, serialized, {
                EX: ttlSeconds
            });
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Deletes a single key
     */
    async del(key) {
        if (!this.isReady || !this.client) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Invalidates all keys matching a glob pattern (e.g. students:*)
     */
    async delByPattern(pattern) {
        if (!this.isReady || !this.client) return false;
        try {
            const keys = await this.client.keys(pattern);
            if (keys && keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Returns operational status for diagnostics
     */
    getStatus() {
        return {
            enabled: this.enabled,
            status: this.isReady ? "Connected" : "Offline",
            host: process.env.REDIS_URL || "redis://127.0.0.1:6379"
        };
    }
}

module.exports = new CacheService();
