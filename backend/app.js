import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import PostgresRateLimitStore from "./middleware/postgresRateLimitStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import wishlistRoutes from "./routes/wishlist.js";
import orderRoutes from "./routes/orders.js";
import uploadRoutes from "./routes/upload.js";
import userRoutes from "./routes/users.js";

// Import db connection
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

dotenv.config();

const app = express();

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Trust the ALB/proxy's X-Forwarded-For header (required for rate limiting and
// accurate client IPs behind AWS ALB / any reverse proxy)
app.set("trust proxy", 1);

// Body parsing middleware - MUST be first
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// PostgreSQL session store setup
const PgSession = connectPgSimple(session);
const isRDS = (process.env.DATABASE_URL || "").includes(".rds.amazonaws.com");
const sessionDbPoolMax = parsePositiveInt(process.env.SESSION_DB_POOL_MAX, 4);
const sessionDbIdleTimeoutMs = parsePositiveInt(
  process.env.SESSION_DB_POOL_IDLE_TIMEOUT_MS,
  30_000,
);
const sessionDbConnectTimeoutMs = parsePositiveInt(
  process.env.SESSION_DB_POOL_CONNECT_TIMEOUT_MS,
  5_000,
);

const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: sessionDbPoolMax,
  idleTimeoutMillis: sessionDbIdleTimeoutMs,
  connectionTimeoutMillis: sessionDbConnectTimeoutMs,
  // Rely on the system CA bundle (ca-certificates in Alpine) to verify RDS cert
  ...(isRDS && { ssl: { rejectUnauthorized: true } }),
});

// Session middleware - MUST be before CORS
const sessionName = "sessionId";
app.set("sessionName", sessionName);

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: "user_sessions", // Table will be auto-created
      createTableIfMissing: true,
    }),
    name: sessionName,
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true only in production with HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    },
    proxy: true, // Trust proxy for session cookies
  }),
);

// Security middleware
// In production, frontend is served from the same origin so default
// helmet settings are fine. In dev (separate ports) we relax CORP.
if (process.env.NODE_ENV !== "production") {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
} else {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "https://js.stripe.com",
            "https://maps.googleapis.com",
          ],
          scriptSrcElem: [
            "'self'",
            "https://js.stripe.com",
            "https://maps.googleapis.com",
          ],
          styleSrc: ["'self'", "https:", "'unsafe-inline'"],
          fontSrc: ["'self'", "https:", "data:"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: [
            "'self'",
            "https://api.stripe.com",
            "https://checkout.stripe.com",
          ],
          frameSrc: [
            "'self'",
            "https://js.stripe.com",
            "https://hooks.stripe.com",
            "https://checkout.stripe.com",
          ],
          // Do NOT include upgradeInsecureRequests — ALB only has HTTP for now.
          upgradeInsecureRequests: null,
        },
      },
      // Disable COOP — it requires HTTPS to be meaningful and causes warnings on HTTP
      crossOriginOpenerPolicy: false,
    }),
  );
}

// CORS — development only (frontend on :3000, backend on :3001).
// In production both are served from the same Express process, so no CORS needed.
if (process.env.NODE_ENV !== "production") {
  const corsOptions = {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
}

const rateLimitWindowMs = parsePositiveInt(
  process.env.RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000,
);
const rateLimitMax = parsePositiveInt(process.env.RATE_LIMIT_MAX, 500);
const rateLimitCleanupIntervalMs = parsePositiveInt(
  process.env.RATE_LIMIT_CLEANUP_INTERVAL_MS,
  10 * 60 * 1000,
);
const rateLimitStore = new PostgresRateLimitStore({
  pool: pgPool,
  tableName: process.env.RATE_LIMIT_TABLE || "rate_limit_hits",
  cleanupIntervalMs: rateLimitCleanupIntervalMs,
});

// Rate limiting shared across all app instances
const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  store: rateLimitStore,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS", // skip rate limiting for preflight
  message: "Too many requests from this IP, please try again later",
});
app.use("/api/", limiter);

// Debug session middleware (development only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log("Session ID:", req.sessionID);
    // console.log("Session Data:", req.session);
    // console.log("Cookies:", req.headers.cookie);
    next();
  });
  // Logging middleware - only in development to avoid performance issues in production
  app.use(morgan("dev"));
}

// Serve hashed frontend assets directly; missing asset files should 404 instead
// of falling through to index.html (prevents MIME type errors in the browser).
app.use(
  "/assets",
  express.static(join(__dirname, "public", "assets"), {
    maxAge: "1y",
    immutable: true,
    fallthrough: false,
  }),
);

// Serve remaining static files (favicon, manifest, etc.)
app.use(express.static(join(__dirname, "public")));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// SPA catch-all — API misses return JSON 404, everything else serves index.html
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "Route not found" });
  }

  // Do not serve SPA HTML for unknown static files.
  if (/\.[a-zA-Z0-9]+$/.test(req.path) || req.path.startsWith("/assets/")) {
    return res.status(404).end();
  }

  res.sendFile(join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;

// Test database connection and start server
async function startServer() {
  try {
    // Test DB connection with proper SQL query
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }
}

startServer();

const shutdown = () => {
  rateLimitStore.shutdown();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default app;
