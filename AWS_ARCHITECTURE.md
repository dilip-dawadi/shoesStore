# AWS Shoe Store Architecture

## Overview

This document describes the AWS architecture for the Shoe Store e-commerce application, aligned with the AWS Architecture rubric requirements.

## Architecture Diagram Components

### 1. Compute Layer - Application Hosting (10 marks)

**Frontend:**

- **AWS Amplify** or **S3 + CloudFront**: Host React application
  - React 18 with React Query for state management
  - Optimized build with code splitting
  - CDN distribution for global performance

**Backend:**

- **AWS Elastic Beanstalk** or **ECS/Fargate**: Host Node.js Express API
  - Auto-scaling based on traffic
  - Load balancer for high availability
  - Health checks and monitoring

**Alternative:**

- **AWS Lambda + API Gateway**: Serverless architecture for cost optimization

### 2. Storage & Database - Data Persistence (10 marks)

**Primary Database:**

- **AWS RDS PostgreSQL**: Relational database for structured data
  - Multi-AZ deployment for high availability
  - Automated backups and point-in-time recovery
  - Tables: users, products, orders, carts, wishlists, reviews
  - Drizzle ORM for type-safe queries

**File Storage:**

- **Cloudinary**: Image and media storage
  - Product images, user avatars
  - Automatic optimization and transformation
  - CDN delivery for fast loading

**Alternative S3 Usage:**

- Store static assets, backups
- Lifecycle policies for cost optimization

### 3. Networking - VPC Configuration (10 marks)

**VPC Architecture:**

```
VPC (10.0.0.0/16)
├── Public Subnets (10.0.1.0/24, 10.0.2.0/24)
│   ├── Application Load Balancer
│   ├── NAT Gateway
│   └── Bastion Host (optional)
│
└── Private Subnets (10.0.10.0/24, 10.0.11.0/24)
    ├── Application Servers (ECS/EB)
    └── RDS PostgreSQL instances
```

**Security Groups:**

- ALB Security Group: Allow 80/443 from internet
- App Security Group: Allow traffic from ALB only
- DB Security Group: Allow 5432 from App servers only

**Route Tables:**

- Public: Route to Internet Gateway
- Private: Route to NAT Gateway for outbound traffic

### 4. Security - IAM & Access Control (10 marks)

**IAM Roles:**

- **EC2/ECS Role**: Access to CloudWatch, S3, SNS
- **Lambda Execution Role**: Access to RDS, CloudWatch
- **Developer Role**: Limited access for deployment

**Security Best Practices:**

- JWT tokens for authentication
- Bcrypt for password hashing
- Helmet.js for HTTP security headers
- Rate limiting to prevent DDoS
- Express-validator for input validation
- HTTPS only (TLS 1.2+)
- Environment variables for secrets (AWS Secrets Manager)

**Database Security:**

- No public access to RDS
- SSL/TLS connections required
- Regular security patches

### 5. Payment Integration (10 marks)

**Stripe Payment Gateway:**

- Sandbox mode for development/demo
- Payment Intents API for secure payments
- Webhook integration for payment status updates
- PCI compliance through Stripe

**Implementation:**

```javascript
// Order creation with payment
POST /api/orders
- Creates Stripe PaymentIntent
- Returns client_secret to frontend
- Stores order with pending status
- Confirms payment through webhook
```

### 6. Messaging System - Notifications (10 marks)

**AWS SNS (Simple Notification Service):**

- Email notifications for:
  - User registration verification
  - Password reset requests
  - Order confirmations
  - Order status updates

**Fallback:**

- Nodemailer for development
- SMTP integration

**Alternative:**

- **AWS SES** for production email delivery
- Cost-effective at scale

### 7. Monitoring & Logging - Observability (5 marks)

**AWS CloudWatch:**

- Application logs from ECS/EB
- Custom metrics (API response times, error rates)
- Alarms for critical issues
- Dashboard for real-time monitoring

**Metrics Tracked:**

- API response times
- Error rates (4xx, 5xx)
- Database connection pool
- Memory and CPU utilization
- Request counts per endpoint

**Log Groups:**

- `/aws/elasticbeanstalk/app-name/application`
- `/aws/rds/instance/postgres/error`
- `/aws/lambda/function-name`

**Alarms:**

- High error rate (>5%)
- Database CPU >80%
- Memory utilization >85%
- Unhealthy target count

### 8. Functionality - End-to-End Flow (10 marks)

**User Journey:**

1. **Browse Products**
   - User visits site → CloudFront → S3/Amplify
   - Loads product list → API → RDS PostgreSQL
   - Images served from Cloudinary CDN

2. **Add to Cart**
   - User adds items → JWT authentication → API
   - Cart stored in PostgreSQL
   - Real-time updates with React Query

3. **Checkout**
   - User proceeds to checkout
   - Stripe payment form (PCI compliant)
   - Create order with payment intent
   - Stripe confirms payment → webhook

4. **Order Confirmation**
   - SNS sends confirmation email
   - Order status updated in database
   - User redirected to success page

**Technical Flow:**

```
[Browser] → [CloudFront/CDN] → [React App]
    ↓
[API Gateway/ALB] → [Express Backend]
    ↓
[RDS PostgreSQL] ← [Drizzle ORM]
    ↓
[Cloudinary] ← [Product Images]
    ↓
[Stripe API] ← [Payment Processing]
    ↓
[AWS SNS] ← [Email Notifications]
```

### 9. Additional AWS Services

**AWS Secrets Manager:**

- Store database credentials
- API keys (Stripe, Cloudinary)
- JWT secrets

**AWS Systems Manager Parameter Store:**

- Application configuration
- Environment-specific settings

**AWS Certificate Manager (ACM):**

- SSL/TLS certificates
- Automatic renewal

**AWS Route 53:**

- DNS management
- Domain routing
- Health checks

**AWS CloudTrail:**

- Audit logging
- Compliance tracking

## Deployment Strategy

### Frontend Deployment

```bash
# Build React app
npm run build

# Deploy to S3/Amplify
aws s3 sync build/ s3://bucket-name
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

### Backend Deployment

```bash
# Using Elastic Beanstalk
eb init
eb create environment-name
eb deploy

# Or using Docker + ECS
docker build -t app .
docker push ecr-repo-url
aws ecs update-service --cluster cluster-name --service service-name
```

### Database Migration

```bash
# Run migrations
npm run db:migrate

# Or using Drizzle
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Cost Optimization

1. **Auto-scaling**: Scale down during low traffic
2. **Reserved Instances**: For predictable workloads
3. **S3 Lifecycle Policies**: Archive old data
4. **CloudFront caching**: Reduce origin requests
5. **RDS instance sizing**: Right-size based on usage

## High Availability & Disaster Recovery

- Multi-AZ RDS deployment
- Auto-scaling groups across AZs
- Regular automated backups
- Point-in-time recovery enabled
- CloudWatch alarms for proactive monitoring

## Security Compliance

- HTTPS everywhere
- No hardcoded secrets
- IAM least privilege principle
- Regular security patching
- WAF for DDoS protection
- VPC isolation

## Performance Optimization

- CDN for static assets
- Database query optimization
- Connection pooling
- Caching strategies (Redis/ElastiCache optional)
- Image optimization (Cloudinary)
- Code splitting and lazy loading

## Monitoring & Alerting

- CloudWatch dashboard
- Error tracking (CloudWatch Insights)
- Performance metrics
- SNS alerts for critical issues
- Weekly performance reports

---

## Technology Stack Summary

**Frontend:**

- React 18
- React Query (state management)
- React Hook Form (form handling)
- React Router v6
- Tailwind CSS
- Axios

**Backend:**

- Node.js + Express
- Drizzle ORM
- PostgreSQL
- JWT authentication
- Bcrypt
- Helmet, Rate Limiting

**Infrastructure:**

- AWS (RDS, EC2/ECS, S3, CloudFront, SNS, CloudWatch)
- Cloudinary (image storage)
- Stripe (payments)

**DevOps:**

- Git/GitHub
- AWS CodePipeline (CI/CD)
- Docker (optional)
- Elastic Beanstalk or ECS
