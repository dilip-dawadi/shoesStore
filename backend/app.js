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

// Trust the ALB/proxy's X-Forwarded-For header (required for rate limiting and
// accurate client IPs behind AWS ALB / any reverse proxy)
app.set("trust proxy", 1);

// Body parsing middleware - MUST be first
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// PostgreSQL session store setup
const PgSession = connectPgSimple(session);
const isRDS = (process.env.DATABASE_URL || "").includes(".rds.amazonaws.com");
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
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
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "https:", "'unsafe-inline'"],
          fontSrc: ["'self'", "https:", "data:"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          // Do NOT include upgradeInsecureRequests — ALB only has HTTP for now.
          upgradeInsecureRequests: null,
        },
      },
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

// Rate limiting - more generous for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // increased from 100 to 1000
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

// Serve React frontend static build
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

export default app;
