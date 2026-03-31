class PostgresRateLimitStore {
  constructor({
    pool,
    tableName = "rate_limit_hits",
    cleanupIntervalMs = 10 * 60 * 1000,
  }) {
    if (!pool) {
      throw new Error("PostgresRateLimitStore requires a pg Pool instance");
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new Error(
        "Invalid PostgreSQL identifier for rate limit table name",
      );
    }

    this.pool = pool;
    this.tableName = tableName;
    this.cleanupIntervalMs = cleanupIntervalMs;

    this.windowMs = 15 * 60 * 1000;
    this.tableReady = false;
    this.tablePromise = null;
    this.cleanupTimer = null;
  }

  init(options = {}) {
    if (typeof options.windowMs === "number" && options.windowMs > 0) {
      this.windowMs = options.windowMs;
    }

    this.ensureTable().catch((error) => {
      console.error("Rate limit table initialization failed:", error);
    });

    this.startCleanupJob();
  }

  async increment(key) {
    await this.ensureTable();

    const query = `
      INSERT INTO "${this.tableName}" ("key", "hits", "reset_time")
      VALUES ($1, 1, NOW() + ($2 * interval '1 millisecond'))
      ON CONFLICT ("key")
      DO UPDATE SET
        "hits" = CASE
          WHEN "${this.tableName}"."reset_time" <= NOW() THEN 1
          ELSE "${this.tableName}"."hits" + 1
        END,
        "reset_time" = CASE
          WHEN "${this.tableName}"."reset_time" <= NOW()
            THEN NOW() + ($2 * interval '1 millisecond')
          ELSE "${this.tableName}"."reset_time"
        END
      RETURNING "hits", "reset_time";
    `;

    const { rows } = await this.pool.query(query, [key, this.windowMs]);
    const row = rows[0] || {
      hits: 1,
      reset_time: new Date(Date.now() + this.windowMs),
    };

    return {
      totalHits: Number(row.hits || 1),
      resetTime: new Date(row.reset_time),
    };
  }

  async decrement(key) {
    await this.ensureTable();

    const query = `
      UPDATE "${this.tableName}"
      SET "hits" = GREATEST("hits" - 1, 0)
      WHERE "key" = $1;
    `;

    await this.pool.query(query, [key]);
  }

  async resetKey(key) {
    await this.ensureTable();

    const query = `DELETE FROM "${this.tableName}" WHERE "key" = $1;`;
    await this.pool.query(query, [key]);
  }

  async resetAll() {
    await this.ensureTable();

    const query = `DELETE FROM "${this.tableName}";`;
    await this.pool.query(query);
  }

  shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  startCleanupJob() {
    if (this.cleanupTimer || this.cleanupIntervalMs <= 0) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredRows().catch((error) => {
        console.error("Rate limit cleanup failed:", error);
      });
    }, this.cleanupIntervalMs);

    if (typeof this.cleanupTimer.unref === "function") {
      this.cleanupTimer.unref();
    }
  }

  async cleanupExpiredRows() {
    if (!this.tableReady && !this.tablePromise) {
      return;
    }

    await this.ensureTable();
    const query = `DELETE FROM "${this.tableName}" WHERE "reset_time" <= NOW();`;
    await this.pool.query(query);
  }

  async ensureTable() {
    if (this.tableReady) {
      return;
    }

    if (!this.tablePromise) {
      this.tablePromise = this.createTable();
    }

    await this.tablePromise;
    this.tableReady = true;
  }

  async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "${this.tableName}" (
        "key" text PRIMARY KEY,
        "hits" integer NOT NULL DEFAULT 0,
        "reset_time" timestamptz NOT NULL
      );
    `;

    const resetTimeIndexName = `${this.tableName}_reset_time_idx`.slice(0, 63);
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS "${resetTimeIndexName}"
      ON "${this.tableName}" ("reset_time");
    `;

    await this.pool.query(createTableQuery);
    await this.pool.query(createIndexQuery);
  }
}

export default PostgresRateLimitStore;
