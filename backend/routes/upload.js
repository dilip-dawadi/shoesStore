import express from "express";
import multer from "multer";
import { uploadToS3, deleteFromS3 } from "../services/s3.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Upload single image
router.post(
  "/image",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const result = await uploadToS3(
        req.file.buffer,
        req.file.mimetype,
        "shoes-store/products",
      );

      res.json(result);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  },
);

// Upload multiple images
router.post(
  "/images",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadPromises = req.files.map((file) =>
        uploadToS3(file.buffer, file.mimetype, "shoes-store/products"),
      );

      const results = await Promise.all(uploadPromises);

      res.json(results);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  },
);

// Delete image
router.delete("/image", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ message: "S3 key required" });
    }

    await deleteFromS3(key);

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
