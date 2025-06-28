/**
 * In-Memory Cache Service with TTL support
 * For production, consider using Redis for distributed caching
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttlTimers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);

      // Check if entry has expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update access time for LRU
      entry.lastAccessed = Date.now();
      this.stats.hits++;
      return entry.value;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlMs - Time to live in milliseconds (optional)
   */
  set(key, value, ttlMs = null) {
    const entry = {
      value,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    };

    // Clear existing timer if any
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
      this.ttlTimers.delete(key);
    }

    this.cache.set(key, entry);
    this.stats.sets++;

    // Set TTL timer if specified
    if (ttlMs) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttlMs);

      this.ttlTimers.set(key, timer);
    }

    // Implement basic LRU eviction if cache gets too large
    if (this.cache.size > 1000) {
      this.evictLRU();
    }
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key to delete
   * @returns {boolean} - True if key existed and was deleted
   */
  delete(key) {
    const existed = this.cache.has(key);

    if (existed) {
      this.cache.delete(key);
      this.stats.deletes++;
    }

    // Clear TTL timer if exists
    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
      this.ttlTimers.delete(key);
    }

    return existed;
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} - True if key exists and not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all TTL timers
    for (const timer of this.ttlTimers.values()) {
      clearTimeout(timer);
    }

    this.cache.clear();
    this.ttlTimers.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0,
      size: this.cache.size,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Get all keys in cache
   * @returns {string[]} - Array of cache keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   * @returns {number} - Number of entries in cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Evict least recently used entries
   */
  evictLRU() {
    const entries = Array.from(this.cache.entries());

    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove oldest 10% of entries
    const toRemove = Math.floor(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.delete(entries[i][0]);
    }

    console.log(`Cache LRU eviction: removed ${toRemove} entries`);
  }

  /**
   * Estimate memory usage
   * @returns {string} - Memory usage estimate
   */
  getMemoryUsage() {
    let size = 0;

    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 encoding
      size += JSON.stringify(entry.value).length * 2;
      size += 100; // Overhead for timestamps and structure
    }

    // Convert to human readable format
    const units = ["B", "KB", "MB", "GB"];
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Destroy cache service and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Singleton instance
let cacheInstance = null;

const getCache = () => {
  if (!cacheInstance) {
    cacheInstance = new CacheService();
  }
  return cacheInstance;
};

module.exports = { CacheService, getCache };
