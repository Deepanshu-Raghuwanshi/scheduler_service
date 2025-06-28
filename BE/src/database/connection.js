const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

class DatabaseConnection {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DB_CONNECTION_STRING,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 5000,
      max: 20,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 60000,
    });

    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }

  async initialize() {
    try {
      console.log("Initializing database...");

      // Test connection
      const client = await this.pool.connect();
      console.log("Database connection established");

      // Run schema creation
      const schemaSQL = fs.readFileSync(
        path.join(__dirname, "schema.sql"),
        "utf8"
      );

      await client.query(schemaSQL);
      console.log("Database schema initialized");

      client.release();

      return true;
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      // Log slow queries (> 100ms)
      if (duration > 100) {
        console.warn(`Slow query detected: ${duration}ms`, { text, params });
      }

      return result;
    } catch (error) {
      console.error("Database query error:", {
        text,
        params,
        error: error.message,
      });
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async close() {
    await this.pool.end();
    console.log("Database connection pool closed");
  }

  // Health check method
  async healthCheck() {
    try {
      const result = await this.query("SELECT 1 as health");
      return { healthy: true, latency: Date.now() };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

// Singleton pattern for database connection
let dbInstance = null;

const getDatabase = () => {
  if (!dbInstance) {
    dbInstance = new DatabaseConnection();
  }
  return dbInstance;
};

module.exports = { getDatabase, DatabaseConnection };
