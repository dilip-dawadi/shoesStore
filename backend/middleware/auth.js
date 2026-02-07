import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      res.status(440).json({ message: "Unknown Request" });
      return;
    }
    const token = req.headers.authorization.split(" ")[1];
    let decodedData;
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
    if (decodedData?.id) {
      req.userId = decodedData.id;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decodedData.id));
      if (user) {
        delete user.password; // Remove password from response
        req.user = user;
      }
      next();
    } else {
      throw new Error("Invalid token");
    }
  } catch (error) {
    res.status(440).json({ message: "Sorry, you are not authorized" });
  }
};
const checkAdmin = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      res.status(440).json({ message: "Unknown Request" });
      return;
    }
    const token = req.headers.authorization.split(" ")[1];
    let decodedData;
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
    if (decodedData?.role === "admin" || decodedData?.isAdmin === true) {
      req.userId = decodedData?.id;
      next();
    } else {
      throw new Error("Unauthorized Admin");
    }
  } catch (error) {
    res.status(440).json({ message: error.message });
  }
};
export { auth, checkAdmin };
export const authMiddleware = auth;
export const adminMiddleware = checkAdmin;
