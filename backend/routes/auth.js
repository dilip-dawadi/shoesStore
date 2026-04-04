import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/email.js";
import crypto from "crypto";

const router = express.Router();

// Register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("firstName").optional().trim(),
    body("lastName").optional().trim(),
    body("address").optional().trim(),
    body("number").optional().trim(),
  ],
  async (req, res) => {
    try {
      console.log("Registration request body:", req.body); // Debug log
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array()); // Debug log
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName, address, number } =
        req.body;

      // Combine firstName and lastName to create name
      const name =
        `${firstName || ""} ${lastName || ""}`.trim() || email.split("@")[0];

      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
          phone: number || null,
          address: address || null,
          verificationToken,
          isVerified: false,
        })
        .returning();

      // Try to send verification email (optional - don't fail if email service is down)
      try {
        await sendVerificationEmail(email, verificationToken, newUser.id);
      } catch (emailError) {
        console.error("Send verification email error:", emailError);
        // Continue - user is still created successfully
      }

      res.status(201).json({
        success: true,
        message: "User created successfully! You can now login.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if verified
      if (!user.isVerified) {
        return res
          .status(401)
          .json({ message: "Please verify your email first" });
      }

      // Store user in session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        role: user.role || "user",
      };

      // Save session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }

        const responseData = {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            isVerified: user.isVerified,
            role: user.role || "user",
          },
        };
        res.json(responseData);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Verify email
router.post("/verify-email", async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const parsedUserId = Number.parseInt(String(req.body?.userId || ""), 10);

    if (!token) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    let user;

    if (Number.isInteger(parsedUserId) && parsedUserId > 0) {
      [user] = await db.select().from(users).where(eq(users.id, parsedUserId));
    }

    if (!user) {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token));
    }

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    if (user.isVerified) {
      return res.json({ message: "Email already verified" });
    }

    if (String(user.verificationToken || "") !== token) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    await db
      .update(users)
      .set({ isVerified: true, verificationToken: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    if (req.session?.userId === user.id && req.session?.user) {
      req.session.user = {
        ...req.session.user,
        isVerified: true,
      };
    }

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return res.json({
        message: "If the email exists, a reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await db
      .update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      })
      .where(eq(users.id, user.id));

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error("Forgot password email send failed:", emailError);
      // Do not leak delivery failures to clients. Keep the generic response.
    }

    res.json({ message: "If the email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetPasswordToken, token));

    if (!user || new Date() > user.resetPasswordExpires) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .where(eq(users.id, user.id));

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout - destroy session
router.post("/logout", (req, res) => {
  const sessionName = req.app.get("sessionName") || "sessionId";

  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    // Clear both possible cookie names
    res.clearCookie(sessionName, { path: "/" });
    res.clearCookie("connect.sid", { path: "/" });
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Get current session/user
router.get("/session", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.json({
        isAuthenticated: false,
        user: null,
      });
    }

    const [freshUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isVerified: users.isVerified,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, req.session.userId));

    if (!freshUser) {
      req.session.destroy(() => {});
      return res.json({
        isAuthenticated: false,
        user: null,
      });
    }

    req.session.user = {
      id: freshUser.id,
      email: freshUser.email,
      name: freshUser.name,
      isVerified: freshUser.isVerified,
      role: freshUser.role || "user",
    };

    return res.json({
      isAuthenticated: true,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Session fetch error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
