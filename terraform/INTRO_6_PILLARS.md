# Terraform Intro: What To Say (Service + 6 Pillars)

Use this as a simple speaker guide while presenting the infrastructure.

## 1) 30-Second Intro Script

We deployed Shoe Store on AWS using Terraform so infrastructure is repeatable and version controlled.
The app runs on ECS Fargate behind an ALB, pulls images from ECR, reads secrets from SSM Parameter Store, and connects to RDS.
For protection and operations, we added WAF, CloudWatch logs and alarms, SNS notifications, and a Synthetics health canary.
This design is aligned with the AWS Well-Architected 6 pillars.

## 2) Why We Use Each Service (Simple Talk Track)

### Terraform

- Why: Infrastructure as Code keeps changes consistent and reviewable.
- Say: We avoid manual setup and reduce config drift by keeping infra in code.

### Amazon ECS Fargate

- Why: Run containers without managing EC2 servers.
- Say: Fargate gives simpler operations, automatic recovery, and scaling without server maintenance.

### Amazon ECR

- Why: Private image registry for our Docker app.
- Say: ECR keeps deployment artifacts secure and versioned.

### Application Load Balancer (ALB)

- Why: Single public entry point with health checks and target routing.
- Say: ALB improves availability by routing only to healthy tasks.

### Auto Scaling (ECS Service)

- Why: Scale task count based on traffic pressure (ALB requests).
- Say: We scale out during demand spikes and scale in when demand drops.

### AWS Systems Manager Parameter Store (SecureString)

- Why: Store sensitive config like DB URL and secrets securely.
- Say: Secrets are not hardcoded in code or task definitions.

### IAM Roles (Execution + Task)

- Why: Least-privilege access for ECS runtime and deployment needs.
- Say: The app only gets the permissions it needs, reducing blast radius.

### Security Groups + RDS Rule

- Why: Restrict network traffic by source and port.
- Say: Only ALB can reach ECS, and only ECS can reach PostgreSQL on 5432.

### AWS WAF

- Why: Managed protections for OWASP risks, bad IPs, and rate abuse.
- Say: WAF blocks common attack patterns before traffic hits the app.

### CloudWatch Logs, Metrics, Dashboard, and Alarms

- Why: Central observability for app health and incidents.
- Say: We monitor 5xx, CPU, and memory, then alert quickly when thresholds break.

### Amazon SNS (Alarm Notifications)

- Why: Send operational alerts to email/subscribers.
- Say: SNS ensures issues are pushed to humans immediately.

### CloudWatch Synthetics Canary

- Why: Proactive health checks to catch uptime issues early.
- Say: Canary checks /health regularly so we detect problems before users report them.

### S3 (Canary Artifacts + App Media)

- Why: Durable storage for canary outputs and product images.
- Say: S3 is low-maintenance storage with lifecycle controls.

## 3) 6 Pillars Mapping (What To Say)

### Operational Excellence

- Terraform for repeatable deploys and easier reviews.
- CloudWatch dashboard + alarms for day-2 operations.
- Standardized ECS deployment model for predictable releases.

Speaker line: We built operations into the platform so runbooks and troubleshooting are faster.

### Security

- WAF managed rules and rate limiting at the edge.
- IAM least privilege for task and execution roles.
- Secrets in SSM SecureString, not in source code.
- Network isolation using security groups.

Speaker line: Security is layered across edge, identity, secrets, and network controls.

### Reliability

- ALB health checks route traffic only to healthy tasks.
- ECS service maintains desired task count.
- Auto Scaling handles load spikes.
- Alarms + canary improve incident detection speed.

Speaker line: We designed for failure by adding health checks, self-healing, scaling, and alerting.

### Performance Efficiency

- Containerized workload on Fargate with tunable CPU/memory.
- Request-based scaling target for better responsiveness under load.
- CloudWatch metrics guide right-sizing decisions.

Speaker line: Capacity tracks traffic demand, so we keep response time stable without overprovisioning.

### Cost Optimization

- Fargate avoids paying for idle EC2 hosts.
- Baseline desired count is small, with scale-out only when needed.
- S3 lifecycle expiration keeps canary artifacts short-lived.
- Shared observability resources avoid tooling sprawl.

Speaker line: We keep baseline cost lean and spend more only when traffic or incidents require it.

### Sustainability

- Auto scaling reduces always-on idle compute.
- Right-sized task resources reduce waste.
- Log/artifact retention is controlled to minimize unnecessary storage growth.

Speaker line: We reduce resource waste by scaling to demand and keeping retention policies disciplined.

## 4) 20-Second Closing Script

Our Terraform stack is simple but production-minded.
Each service has a clear purpose, and together they meet all 6 pillars with practical controls for security, reliability, performance, operations, cost, and sustainability.
