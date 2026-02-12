import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const auth = async (req, res, next) => {
  try {
    // Check if user is authenticated via session
    if (!req.session || !req.session.userId) {
      return res.status(440).json({ message: "Not authenticated" });
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId));

    if (!user) {
      return res.status(440).json({ message: "User not found" });
    }

    // Attach user to request
    delete user.password; // Remove password from response
    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(440).json({ message: "Authentication failed" });
  }
};

const checkAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated via session
    if (!req.session || !req.session.userId) {
      return res.status(440).json({ message: "Not authenticated" });
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId));

    if (!user) {
      return res.status(440).json({ message: "User not found" });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(440).json({ message: "Authorization failed" });
  }
};

export { auth, checkAdmin };
export const authMiddleware = auth;
export const adminMiddleware = checkAdmin;
