import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema.js";

dotenv.config();

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Create postgres connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

// Use SSL for RDS; rely on the system CA bundle (ca-certificates installed in
// Docker image) to verify the cert chain. Plain connection for local dev.
const isRDS = connectionString.includes(".rds.amazonaws.com");
const sslOptions = isRDS ? { ssl: "require" } : {};
const dbPoolMax = parsePositiveInt(process.env.DB_POOL_MAX, 8);
const dbIdleTimeoutSeconds = parsePositiveInt(
  process.env.DB_POOL_IDLE_TIMEOUT_SECONDS,
  30,
);
const dbConnectTimeoutSeconds = parsePositiveInt(
  process.env.DB_POOL_CONNECT_TIMEOUT_SECONDS,
  30,
);
const dbPoolOptions = {
  max: dbPoolMax,
  idle_timeout: dbIdleTimeoutSeconds,
  connect_timeout: dbConnectTimeoutSeconds,
  ...sslOptions,
};

// For query purposes
const queryClient = postgres(connectionString, dbPoolOptions);
export const db = drizzle(queryClient, { schema });

// For migrations
export const migrationClient = postgres(connectionString, {
  max: 1,
  idle_timeout: dbIdleTimeoutSeconds,
  connect_timeout: dbConnectTimeoutSeconds,
  ...sslOptions,
});
