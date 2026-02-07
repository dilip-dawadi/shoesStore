import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "shoes-store-images";

/**
 * Upload image to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimetype - File mime type
 * @param {string} folder - Folder name in S3
 * @returns {Promise<Object>} - S3 response
 */
export const uploadToS3 = async (fileBuffer, mimetype, folder = "products") => {
  try {
    const fileExtension = mimetype.split("/")[1];
    const fileName = `${folder}/${crypto.randomBytes(16).toString("hex")}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimetype,
    });

    await s3Client.send(command);

    // Generate public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;

    return {
      url,
      key: fileName,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("Failed to upload image to S3");
  }
};

/**
 * Delete image from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} - S3 response
 */
export const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const result = await s3Client.send(command);
    return result;
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error("Failed to delete image from S3");
  }
};

/**
 * Upload multiple images
 * @param {Array} files - Array of file objects with buffer and mimetype
 * @param {string} folder - Folder name in S3
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleToS3 = async (files, folder = "products") => {
  try {
    const uploadPromises = files.map((file) =>
      uploadToS3(file.buffer, file.mimetype, folder),
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Multiple upload error:", error);
    throw new Error("Failed to upload multiple images");
  }
};

/**
 * Generate presigned URL for direct upload from client
 * @param {string} fileName - File name
 * @param {string} contentType - Content type
 * @returns {Promise<string>} - Presigned URL
 */
export const getPresignedUploadUrl = async (fileName, contentType) => {
  try {
    const key = `products/${crypto.randomBytes(16).toString("hex")}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return {
      uploadUrl: signedUrl,
      key,
      publicUrl: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`,
    };
  } catch (error) {
    console.error("Presigned URL error:", error);
    throw new Error("Failed to generate presigned URL");
  }
};

export default s3Client;
