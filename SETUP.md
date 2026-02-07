# Shoe Store - Environment Configuration

## Frontend Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_BASE_URL_LOCAL=http://localhost:5000/api
REACT_APP_BASE_URL=https://your-api-domain.com/api

# Stripe (Public Key - Safe to expose)
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

# Optional: Analytics
REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

## Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration (AWS RDS PostgreSQL)
DATABASE_URL=postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/shoesstore

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration (Development - Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
SMTP_FROM=noreply@shoesstore.com

# AWS Configuration (Production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# AWS SNS (Email Notifications)
USE_AWS_SNS=false
AWS_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:account-id:topic-name

# AWS S3 (Optional - if using S3 instead of Cloudinary)
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## AWS Configuration

### AWS RDS PostgreSQL Setup

1. **Create RDS Instance:**

```bash
# Via AWS Console
- Engine: PostgreSQL 15
- Template: Production (or Dev/Test)
- DB Instance: db.t3.micro (or larger)
- Storage: 20GB SSD
- Multi-AZ: Yes (for production)
- VPC: Your VPC
- Public Access: No
- Security Group: Allow 5432 from app servers

# Via AWS CLI
aws rds create-db-instance \
  --db-instance-identifier shoesstore-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --multi-az
```

2. **Connection String:**

```
postgresql://admin:password@shoesstore-db.xxxxx.us-east-1.rds.amazonaws.com:5432/shoesstore
```

### AWS SNS Setup

1. **Create SNS Topic:**

```bash
aws sns create-topic --name shoesstore-notifications

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:shoesstore-notifications \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### Cloudinary Setup

1. **Sign up at https://cloudinary.com**
2. **Get credentials from Dashboard:**
   - Cloud Name
   - API Key
   - API Secret

3. **Configure upload presets:**
   - Folder: `shoes-store/products`
   - Transformation: Auto quality, format

### Stripe Setup

1. **Sign up at https://stripe.com**
2. **Get API keys:**
   - Publishable key (frontend)
   - Secret key (backend)

3. **Set up webhooks:**

```
Endpoint URL: https://your-api.com/api/webhooks/stripe
Events: payment_intent.succeeded, payment_intent.failed
```

## Deployment Instructions

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 2. Database Setup

```bash
cd backend

# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Optional: View DB with Drizzle Studio
npm run db:studio
```

### 3. Development

```bash
# Frontend (from root)
npm start

# Backend (from backend folder)
npm run dev
```

### 4. Production Build

```bash
# Frontend
npm run build

# Backend - ensure all env vars are set
NODE_ENV=production npm start
```

### 5. AWS Deployment

**Option A: Elastic Beanstalk**

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js shoe-store-api

# Create environment
eb create production

# Deploy
eb deploy
```

**Option B: ECS/Fargate**

```bash
# Build Docker image
docker build -t shoe-store-api .

# Tag and push to ECR
docker tag shoe-store-api:latest xxx.dkr.ecr.us-east-1.amazonaws.com/shoe-store-api:latest
docker push xxx.dkr.ecr.us-east-1.amazonaws.com/shoe-store-api:latest

# Update ECS service
aws ecs update-service --cluster shoe-store --service api --force-new-deployment
```

**Frontend - Amplify/S3:**

```bash
# Build
npm run build

# Deploy to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## Security Checklist

- [ ] All secrets in environment variables (never commit .env)
- [ ] JWT_SECRET is strong and unique
- [ ] Database has strong password
- [ ] RDS is in private subnet (no public access)
- [ ] HTTPS enabled with valid certificate
- [ ] Rate limiting configured
- [ ] CORS configured for production domain
- [ ] Helmet security headers enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries via Drizzle)
- [ ] XSS protection
- [ ] CSRF protection for state-changing operations

## Monitoring Setup

1. **CloudWatch Logs:**

```bash
# Create log group
aws logs create-log-group --log-group-name /aws/shoe-store/api
```

2. **CloudWatch Alarms:**

```bash
# CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu \
  --alarm-description "Alarm when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql "postgresql://user:pass@host:5432/dbname"

# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

### CORS Issues

```javascript
// Verify CORS config in backend/app.js
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

### Email Not Sending

```bash
# Test SMTP
node -e "require('./backend/services/email.js').sendTestEmail()"
```

## Cost Estimation (Monthly)

- RDS db.t3.micro: ~$15-25
- EC2 t3.small (if not using EB): ~$15
- Elastic Beanstalk: ~$0 (pay for resources)
- S3 + CloudFront: ~$5-10
- SNS: ~$0.50 (first 1000 emails free)
- Cloudinary Free Tier: $0 (25GB storage, 25GB bandwidth)
- Route 53: ~$0.50
- **Total: ~$35-50/month** (for small-scale)

## Support

For issues or questions:

1. Check logs in CloudWatch
2. Review security group rules
3. Verify environment variables
4. Check AWS service health dashboard
