import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema.js";

dotenv.config();

// Create postgres connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

// Use SSL for RDS; rely on the system CA bundle (ca-certificates installed in
// Docker image) to verify the cert chain. Plain connection for local dev.
const isRDS = connectionString.includes(".rds.amazonaws.com");
const sslOptions = isRDS ? { ssl: "require" } : {};

// For query purposes
const queryClient = postgres(connectionString, sslOptions);
export const db = drizzle(queryClient, { schema });

// For migrations
export const migrationClient = postgres(connectionString, {
  max: 1,
  ...sslOptions,
});
