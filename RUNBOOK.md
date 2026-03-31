# Shoes Store — Operations Runbook

Everything you need to operate, deploy, and maintain this app in production.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Deploy a New Version](#2-deploy-a-new-version)
3. [Run Database Migrations](#3-run-database-migrations)
4. [Update a Secret / Env Variable](#4-update-a-secret--env-variable)
5. [Promote a User to Admin](#5-promote-a-user-to-admin)
6. [Check App Logs](#6-check-app-logs)
7. [Check App Health](#7-check-app-health)
8. [Restart the App](#8-restart-the-app)
9. [SSH / Exec into the Container](#9-ssh--exec-into-the-container)
10. [Add HTTPS to the ALB](#10-add-https-to-the-alb)
11. [Security Group Rules Reference](#11-security-group-rules-reference)
12. [AWS Resource Reference](#12-aws-resource-reference)
13. [Deploy With GitHub Actions](#13-deploy-with-github-actions)

---

## 1. Architecture Overview

```text
Browser
  │
  ▼
ALB  (shoe-store-alb-532162391.us-east-1.elb.amazonaws.com)  :80
  │
  ▼
ECS Fargate Task  (Express on :5000)
  ├── Serves React frontend from /public (static files)
  └── Serves API under /api/*
  │
  ▼
RDS PostgreSQL  (mydatabase.c0lyq8cwkt3z.us-east-1.rds.amazonaws.com)
```

- **Secrets** → AWS SSM Parameter Store (`/shoe-store/*`)
- **Images** → S3 bucket `shoes-store-images`
- **Emails** → Gmail SMTP via nodemailer
- **Docker image** → ECR `670801933799.dkr.ecr.us-east-1.amazonaws.com/shoe-store:latest`

---

## 2. Deploy a New Version

Run these 3 commands every time you change code:

```bash
# Step 1 — Authenticate Docker with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  670801933799.dkr.ecr.us-east-1.amazonaws.com

# Step 2 — Build and push (cross-compile for linux/amd64 from Apple Silicon)
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  -t 670801933799.dkr.ecr.us-east-1.amazonaws.com/shoe-store:latest \
  --push .

# Step 3 — Tell ECS to pull the new image
aws ecs update-service \
  --cluster shoe-store \
  --service shoe-store \
  --force-new-deployment \
  --region us-east-1 \
  --no-cli-pager
```

> The new container takes ~1-2 minutes to become healthy. The old one keeps running until it's ready.

---

## 3. Run Database Migrations

> ⚠️ RDS is locked down. You must temporarily open your IP, run migrations, then close it again.

```bash
# Step 1 — Get your current public IP
curl -s https://checkip.amazonaws.com

# Step 2 — Open RDS to your IP (replace IP with output from step 1)
aws ec2 authorize-security-group-ingress \
  --group-id sg-0297fd07bf25e48ad \
  --protocol tcp --port 5432 \
  --cidr "YOUR_IP_HERE/32" \
  --region us-east-1

# Step 3 — Run migrations
cd backend
NODE_TLS_REJECT_UNAUTHORIZED=0 npx drizzle-kit push --force

# Step 4 — Remove your IP immediately after
aws ec2 revoke-security-group-ingress \
  --group-id sg-0297fd07bf25e48ad \
  --protocol tcp --port 5432 \
  --cidr "YOUR_IP_HERE/32" \
  --region us-east-1
```

---

## 4. Update a Secret / Env Variable

All secrets are stored in AWS SSM Parameter Store. Changes take effect after a redeployment.

```bash
# Update any secret
aws ssm put-parameter \
  --name "/shoe-store/SECRET_NAME" \
  --type SecureString \
  --overwrite \
  --value "new-value" \
  --region us-east-1

# Then redeploy
aws ecs update-service \
  --cluster shoe-store \
  --service shoe-store \
  --force-new-deployment \
  --region us-east-1
```

**Available secret names:**

| SSM Parameter                       | Description                   |
| ----------------------------------- | ----------------------------- |
| `/shoe-store/DATABASE_URL`          | RDS connection string         |
| `/shoe-store/JWT_SECRET`            | JWT signing secret            |
| `/shoe-store/SESSION_SECRET`        | Express session secret        |
| `/shoe-store/SMTP_USER`             | Gmail address for emails      |
| `/shoe-store/SMTP_PASS`             | Gmail app password            |
| `/shoe-store/SMTP_FROM`             | From address in emails        |
| `/shoe-store/STRIPE_SECRET_KEY`     | Stripe secret key             |
| `/shoe-store/STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

**Non-secret env vars** (set directly in `terraform/terraform.tfvars`, apply with `terraform apply`):

| Variable        | Current Value                                                 |
| --------------- | ------------------------------------------------------------- |
| `NODE_ENV`      | `production`                                                  |
| `AWS_S3_BUCKET` | `shoes-store-images`                                          |
| `FRONTEND_URL`  | `http://shoe-store-alb-532162391.us-east-1.elb.amazonaws.com` |
| `SMTP_HOST`     | `smtp.gmail.com`                                              |
| `SMTP_PORT`     | `587`                                                         |

---

## 5. Promote a User to Admin

From the **Admin Dashboard → Manage Users** page, you can toggle any user's role.

For the **first admin** (or if you need direct DB access temporarily):

```bash
# Step 1 — Open RDS to your IP
curl -s https://checkip.amazonaws.com  # get your IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-0297fd07bf25e48ad \
  --protocol tcp --port 5432 \
  --cidr "YOUR_IP/32" --region us-east-1

# Step 2 — Promote user
cd backend
node -e "
import('./db/index.js').then(async ({ db }) => {
  const { users } = await import('./db/schema.js');
  const { eq } = await import('drizzle-orm');
  const result = await db.update(users)
    .set({ role: 'admin', isVerified: true })
    .where(eq(users.email, 'EMAIL_HERE'))
    .returning({ id: users.id, email: users.email, role: users.role });
  console.log(result.length ? '✅' : '❌ User not found', result[0]);
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
"

# Step 3 — Close RDS
aws ec2 revoke-security-group-ingress \
  --group-id sg-0297fd07bf25e48ad \
  --protocol tcp --port 5432 \
  --cidr "YOUR_IP/32" --region us-east-1
```

---

## 6. Check App Logs

```bash
# Stream live logs from the running container
aws logs tail /ecs/shoe-store \
  --follow \
  --region us-east-1

# Last 100 lines without streaming
aws logs tail /ecs/shoe-store \
  --since 1h \
  --region us-east-1
```

---

## 7. Check App Health

```bash
# Check ECS service status and running task count
aws ecs describe-services \
  --cluster shoe-store \
  --services shoe-store \
  --region us-east-1 \
  --query "services[0].{status:status,running:runningCount,desired:desiredCount,deployments:deployments[*].{status:status,running:runningCount}}" \
  --output json

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups --names shoe-store-tg --region us-east-1 --query "TargetGroups[0].TargetGroupArn" --output text) \
  --region us-east-1 \
  --query "TargetHealthDescriptions[*].{id:Target.Id,port:Target.Port,health:TargetHealth.State}" \
  --output json

# Quick HTTP check
curl -I http://shoe-store-alb-532162391.us-east-1.elb.amazonaws.com
```

---

## 8. Restart the App

```bash
aws ecs update-service \
  --cluster shoe-store \
  --service shoe-store \
  --force-new-deployment \
  --region us-east-1
```

---

## 9. SSH / Exec into the Container

ECS Fargate supports ECS Exec (like SSH into the container):

```bash
# First, get the running task ID
TASK_ID=$(aws ecs list-tasks \
  --cluster shoe-store \
  --service-name shoe-store \
  --region us-east-1 \
  --query "taskArns[0]" \
  --output text | awk -F'/' '{print $NF}')

# Open a shell in the container
aws ecs execute-command \
  --cluster shoe-store \
  --task $TASK_ID \
  --container shoe-store \
  --interactive \
  --command "/bin/sh" \
  --region us-east-1
```

> If you get an error, ECS Exec may need to be enabled:
>
> ```bash
> aws ecs update-service --cluster shoe-store --service shoe-store \
>   --enable-execute-command --region us-east-1
> ```

---

## 10. Add HTTPS to the ALB

Currently the app runs on HTTP only. To add HTTPS:

```bash
# Step 1 — Request a free certificate in ACM (must own a domain)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# Step 2 — Add the HTTPS listener in terraform/alb.tf:
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.app.arn
#   port              = 443
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
#   certificate_arn   = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID"
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.app.arn
#   }
# }

# Step 3 — Apply
cd terraform && terraform apply

# Step 4 — Once on HTTPS, re-enable in backend/app.js:
# upgradeInsecureRequests: []   (remove the null)
# crossOriginOpenerPolicy: false  → remove this line
```

---

## 11. Security Group Rules Reference

**Current strict security chain:**

```text
Internet → ALB SG (sg-0717e0cc5165e4164)
         port 80 open to 0.0.0.0/0

ALB SG → ECS SG (sg-09e51078280c210bf)
         port 5000, only from ALB SG

ECS SG → RDS SG (sg-0297fd07bf25e48ad)
         port 5432, only from ECS SG
```

**Verify rules are clean:**

```bash
# RDS SG — should only show ECS SG reference, no IP CIDRs
aws ec2 describe-security-groups \
  --group-ids sg-0297fd07bf25e48ad \
  --region us-east-1 \
  --query "SecurityGroups[0].IpPermissions" \
  --output json

# ECS SG — should only show ALB SG reference on port 5000
aws ec2 describe-security-groups \
  --group-ids sg-09e51078280c210bf \
  --region us-east-1 \
  --query "SecurityGroups[0].IpPermissions" \
  --output json
```

---

## 12. AWS Resource Reference

| Resource        | ID / Name                                                 |
| --------------- | --------------------------------------------------------- |
| AWS Account     | `670801933799`                                            |
| Region          | `us-east-1`                                               |
| ECR Repo        | `670801933799.dkr.ecr.us-east-1.amazonaws.com/shoe-store` |
| ECS Cluster     | `shoe-store`                                              |
| ECS Service     | `shoe-store`                                              |
| ALB             | `shoe-store-alb-532162391.us-east-1.elb.amazonaws.com`    |
| ALB SG          | `sg-0717e0cc5165e4164`                                    |
| ECS SG          | `sg-09e51078280c210bf`                                    |
| RDS SG          | `sg-0297fd07bf25e48ad`                                    |
| RDS Host        | `mydatabase.c0lyq8cwkt3z.us-east-1.rds.amazonaws.com`     |
| S3 Bucket       | `shoes-store-images`                                      |
| VPC             | `vpc-0949082813da7cf3b`                                   |
| CloudWatch Logs | `/ecs/shoe-store`                                         |
| SSM Prefix      | `/shoe-store/`                                            |
| Terraform State | `terraform/terraform.tfstate` (local)                     |

---

## 13. Deploy With GitHub Actions

This repo now includes a workflow that mirrors the manual deploy steps in section 2:

- Authenticate with ECR
- Build and push `linux/amd64` image to `:latest`
- Force ECS new deployment
- Wait until service is stable

Workflow file:

- `.github/workflows/deploy-ecs.yml`

Required GitHub repository secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Trigger options:

- Automatic on push to `main` when app files change
- Manual trigger from GitHub Actions (`workflow_dispatch`)

How to run manually:

1. Open GitHub repository -> Actions.
2. Select **Deploy To ECS**.
3. Click **Run workflow**.

What to check after run:

```bash
aws ecs describe-services \
  --cluster shoe-store \
  --services shoe-store \
  --region us-east-1 \
  --query "services[0].{status:status,running:runningCount,desired:desiredCount,primary:deployments[?status=='PRIMARY']|[0].rolloutState}" \
  --output json
```
