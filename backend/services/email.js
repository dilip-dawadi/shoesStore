import nodemailer from "nodemailer";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// Configure AWS SNS for production
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// Configure nodemailer for development
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email, token, userId) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&userId=${userId}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@shoesstore.com",
    to: email,
    subject: "Verify Your Email",
    html: `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `,
  };

  try {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.USE_AWS_SNS === "true"
    ) {
      // Use AWS SNS in production
      const command = new PublishCommand({
        Message: `Please verify your email: ${verificationUrl}`,
        TopicArn: process.env.AWS_SNS_TOPIC_ARN,
        Subject: "Verify Your Email",
      });
      await snsClient.send(command);
    } else {
      // Use nodemailer in development
      await transporter.sendMail(mailOptions);
    }
  } catch (error) {
    console.error("Send verification email error:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@shoesstore.com",
    to: email,
    subject: "Password Reset Request",
    html: `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.USE_AWS_SNS === "true"
    ) {
      const command = new PublishCommand({
        Message: `Reset your password: ${resetUrl}`,
        TopicArn: process.env.AWS_SNS_TOPIC_ARN,
        Subject: "Password Reset Request",
      });
      await snsClient.send(command);
    } else {
      await transporter.sendMail(mailOptions);
    }
  } catch (error) {
    console.error("Send password reset email error:", error);
    throw error;
  }
};

export const sendOrderConfirmation = async (email, orderDetails) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@shoesstore.com",
    to: email,
    subject: "Order Confirmation",
    html: `
      <h1>Order Confirmation</h1>
      <p>Thank you for your order!</p>
      <p>Order Number: ${orderDetails.orderNumber}</p>
      <p>Total: $${orderDetails.totalAmount}</p>
    `,
  };

  try {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.USE_AWS_SNS === "true"
    ) {
      const command = new PublishCommand({
        Message: `Order confirmed: ${orderDetails.orderNumber}`,
        TopicArn: process.env.AWS_SNS_TOPIC_ARN,
        Subject: "Order Confirmation",
      });
      await snsClient.send(command);
    } else {
      await transporter.sendMail(mailOptions);
    }
  } catch (error) {
    console.error("Send order confirmation error:", error);
    throw error;
  }
};
