import nodemailer from "nodemailer";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// Configure AWS SNS for production
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure =
  process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465;

// Configure nodemailer for development
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 465,
  secure: true,
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 10000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 15000),
  requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const buildEmailShell = ({ title, subtitle, bodyHtml, ctaLabel, ctaUrl }) => `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:22px 28px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#ffffff;">
                <div style="font-size:20px;font-weight:700;letter-spacing:0.2px;">Shoe Store</div>
                <div style="font-size:13px;opacity:0.85;margin-top:6px;">Order & Account Notifications</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 8px 0;font-size:24px;line-height:1.3;color:#0f172a;">${title}</h1>
                <p style="margin:0 0 22px 0;color:#475569;font-size:14px;line-height:1.6;">${subtitle}</p>
                ${bodyHtml}
                ${
                  ctaLabel && ctaUrl
                    ? `<div style="margin-top:22px;"><a href="${ctaUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;">${ctaLabel}</a></div>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6;">
                This is an automated email from Shoe Store. If you have questions, reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const buildOrderItemsHtml = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  const rows = items
    .map((item) => {
      const name = item?.name || item?.product?.name || "Product";
      const qty = Number(item?.quantity) || 1;
      const price = Number(item?.price ?? item?.product?.price ?? 0);
      const lineTotal = (qty * price).toFixed(2);

      return `
        <tr>
          <td style="padding:10px 0;color:#0f172a;font-size:14px;">${name}</td>
          <td align="center" style="padding:10px 0;color:#475569;font-size:14px;">x${qty}</td>
          <td align="right" style="padding:10px 0;color:#0f172a;font-weight:600;font-size:14px;">$${lineTotal}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin-top:8px;">
      ${rows}
    </table>
  `;
};

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
  const orderUrl = `${process.env.FRONTEND_URL}/orders`;
  const orderItemsHtml = buildOrderItemsHtml(orderDetails.items || []);

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@shoesstore.com",
    to: email,
    subject: `Order Confirmed • ${orderDetails.orderNumber}`,
    html: buildEmailShell({
      title: "Your order is confirmed",
      subtitle:
        "Thank you for shopping with Shoe Store. We have received your payment and started processing your order.",
      bodyHtml: `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:14px;">
          <div style="font-size:13px;color:#64748b;margin-bottom:6px;">Order Number</div>
          <div style="font-size:16px;font-weight:700;color:#0f172a;">${orderDetails.orderNumber}</div>
          <div style="margin-top:10px;font-size:13px;color:#64748b;">Order Total</div>
          <div style="font-size:20px;font-weight:800;color:#0f172a;">$${Number(orderDetails.totalAmount || 0).toFixed(2)}</div>
        </div>
        ${orderItemsHtml}
      `,
      ctaLabel: "View Your Orders",
      ctaUrl: orderUrl,
    }),
  };

  try {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.USE_AWS_SNS === "true"
    ) {
      const command = new PublishCommand({
        Message: `Your order ${orderDetails.orderNumber} is confirmed. Total: $${Number(orderDetails.totalAmount || 0).toFixed(2)}. View details: ${orderUrl}`,
        TopicArn: process.env.AWS_SNS_TOPIC_ARN,
        Subject: `Order Confirmed • ${orderDetails.orderNumber}`,
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

const STATUS_META = {
  pending: {
    title: "Order received",
    subtitle: "We received your order and will start preparing it shortly.",
  },
  processing: {
    title: "Order is being prepared",
    subtitle: "Great news. Your order is now being packed by our team.",
  },
  shipped: {
    title: "Order shipped",
    subtitle:
      "Your package is on the way. We will notify you again once it is delivered.",
  },
  delivered: {
    title: "Order delivered",
    subtitle:
      "Your package was marked as delivered. We hope you enjoy your purchase.",
  },
  cancelled: {
    title: "Order cancelled",
    subtitle:
      "Your order has been cancelled. If payment was captured, refund processing may take a few business days.",
  },
};

export const sendOrderStatusUpdate = async (email, orderDetails) => {
  const normalizedStatus = String(
    orderDetails.status || "pending",
  ).toLowerCase();
  const trackingNumber = String(orderDetails.trackingNumber || "").trim();
  const estimatedDeliveryRaw = String(
    orderDetails.estimatedDelivery || "",
  ).trim();
  const estimatedDeliveryLabel = estimatedDeliveryRaw
    ? new Date(estimatedDeliveryRaw).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const shipmentMetaHtml =
    trackingNumber || estimatedDeliveryLabel
      ? `
        <div style="margin-top:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;">
          <div style="font-size:13px;color:#64748b;margin-bottom:8px;">Shipment Details</div>
          ${
            trackingNumber
              ? `<div style="font-size:14px;color:#0f172a;"><strong>Tracking Number:</strong> ${trackingNumber}</div>`
              : ""
          }
          ${
            estimatedDeliveryLabel
              ? `<div style="font-size:14px;color:#0f172a;margin-top:6px;"><strong>Estimated Delivery:</strong> ${estimatedDeliveryLabel}</div>`
              : ""
          }
        </div>
      `
      : "";

  const meta = STATUS_META[normalizedStatus] || {
    title: "Order status updated",
    subtitle: "Your order status has changed.",
  };
  const orderUrl = `${process.env.FRONTEND_URL}/orders`;

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@shoesstore.com",
    to: email,
    subject: `Order Update • ${orderDetails.orderNumber} • ${normalizedStatus.toUpperCase()}`,
    html: buildEmailShell({
      title: meta.title,
      subtitle: meta.subtitle,
      bodyHtml: `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;">
          <div style="font-size:13px;color:#64748b;margin-bottom:6px;">Order Number</div>
          <div style="font-size:16px;font-weight:700;color:#0f172a;">${orderDetails.orderNumber}</div>
          <div style="margin-top:10px;font-size:13px;color:#64748b;">Current Status</div>
          <div style="display:inline-block;margin-top:6px;background:#dbeafe;color:#1e3a8a;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;">${normalizedStatus}</div>
        </div>
        ${shipmentMetaHtml}
      `,
      ctaLabel: "Track Order Status",
      ctaUrl: orderUrl,
    }),
  };

  try {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.USE_AWS_SNS === "true"
    ) {
      const command = new PublishCommand({
        Message: `Order ${orderDetails.orderNumber} status updated to ${normalizedStatus}.${trackingNumber ? ` Tracking: ${trackingNumber}.` : ""}${estimatedDeliveryLabel ? ` Estimated delivery: ${estimatedDeliveryLabel}.` : ""} View details: ${orderUrl}`,
        TopicArn: process.env.AWS_SNS_TOPIC_ARN,
        Subject: `Order Update • ${orderDetails.orderNumber}`,
      });
      await snsClient.send(command);
    } else {
      await transporter.sendMail(mailOptions);
    }
  } catch (error) {
    console.error("Send order status update error:", error);
    throw error;
  }
};
