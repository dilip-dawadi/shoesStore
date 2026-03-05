import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create postgres connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

// Use SSL for RDS in production; plain connection for local dev
const isRDS = connectionString.includes(".rds.amazonaws.com");
const sslOptions = isRDS
  ? {
      ssl: {
        rejectUnauthorized: true,
        ca: readFileSync(
          join(__dirname, "../certs/global-bundle.pem"),
        ).toString(),
      },
    }
  : {};

// For query purposes
const queryClient = postgres(connectionString, sslOptions);
export const db = drizzle(queryClient, { schema });

// For migrations
export const migrationClient = postgres(connectionString, {
  max: 1,
  ...sslOptions,
});
