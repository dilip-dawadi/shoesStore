import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";
const isRDS = connectionString.includes(".rds.amazonaws.com");

export default defineConfig({
  schema: "./db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
    ...(isRDS && { ssl: "require" }),
  },
  verbose: true,
  strict: false,
});
