/**
 * Simple in-memory cache with TTL (Time To Live)
 * For production, consider using Redis or similar
 */

class Cache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, ttlSeconds = 60) {
        const expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiry });
    }

    get(key) {
        const item = this.cache.get(key);

        if (!item) return null;

        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    invalidate(key) {
        this.cache.delete(key);
    }

    invalidatePattern(pattern) {
        // Invalidate all keys matching a pattern (simple string includes)
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    clear() {
        this.cache.clear();
    }

    // Clean up expired entries periodically
    startCleanup(intervalSeconds = 60) {
        setInterval(() => {
            const now = Date.now();
            for (const [key, item] of this.cache.entries()) {
                if (now > item.expiry) {
                    this.cache.delete(key);
                }
            }
        }, intervalSeconds * 1000);
    }
}

// Export singleton instance
const cache = new Cache();
cache.startCleanup(60); // Clean up every minute

export default cache;
