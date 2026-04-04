# Shoe Store Architecture: 6 Pillars Presentation Notes

## 1. Presentation Goal

- Explain why we chose our AWS services.
- Map each service choice to the 6 AWS Well-Architected pillars.
- Show why this design is effective for scalability, security, reliability, and operations.

## 2. Current Architecture (30-second summary)

- Frontend and backend are currently deployed together through the backend service.
- Backend runs on Amazon ECS Fargate.
- Traffic enters through Application Load Balancer (ALB).
- Database is PostgreSQL (RDS).
- Security controls include AWS WAF, security groups, app-level headers, and rate limiting.
- Observability includes CloudWatch alarms, dashboard, and Synthetics canary.
- Alerting is integrated with SNS email notifications.
- Infrastructure is managed using Terraform.

## 3. Why These Services

- ECS Fargate: no server management, simple container scaling.
- ALB: load balancing + health checks + integration with autoscaling.
- RDS PostgreSQL: managed relational database with durability and backups.
- WAF: managed web protections against common attacks.
- CloudWatch: central metrics, alarms, logs, dashboard, and synthetics checks.
- SNS: immediate alarm notifications to email.
- Terraform: repeatable infrastructure and safer change management.
- SSM Parameter Store: secure secret/config handling for app runtime.

### Why We Chose Our Own Auth Instead of Cognito

- We already use server-side sessions (`express-session` + PostgreSQL store), so custom auth fit naturally with our backend architecture.
- We needed full control over signup, email verification, password reset, and role checks without Cognito-specific flow constraints.
- For this project scope, custom auth reduced service sprawl and integration overhead while we iterate quickly.
- Cost model is simpler at this stage because we avoid Cognito MAU-based pricing until advanced identity features are required.
- Trade-off: we own auth maintenance. If we later need social login, enterprise SSO, or stricter managed compliance controls, Cognito remains a clear upgrade path.

## 4. 6 Pillars (Point-wise)

### A. Operational Excellence

- Terraform codifies infrastructure, so deployments are repeatable.
- CloudWatch dashboard gives one place to view health signals.
- Alarms notify team quickly through SNS.
- Synthetics canary tests health endpoint proactively.
- Effectiveness: faster troubleshooting, fewer manual mistakes, and clearer operations process.

### B. Security

- WAF managed rules protect ALB from common web threats.
- Security groups enforce ALB -> ECS -> RDS network path.
- Secrets are read from SSM instead of hardcoding in code.
- Helmet, session controls, and shared rate limiting reduce app-layer risk.
- Effectiveness: reduced attack surface and better protection of credentials/data.

### C. Reliability

- ALB health checks route traffic only to healthy tasks.
- ECS service restarts unhealthy tasks automatically.
- Request-based autoscaling handles variable traffic.
- Session state in PostgreSQL avoids per-instance session loss.
- Canary provides early warning even when users are inactive.
- Effectiveness: better uptime and graceful recovery from failures.

### D. Performance Efficiency

- Fargate autoscaling adds capacity when request load increases.
- DB indexes improve query speed for common access paths.
- Connection pool tuning prevents DB connection pressure.
- Backend compression reduces payload size.
- Frontend query caching/debouncing lowers duplicate API calls.
- Effectiveness: faster responses and better throughput under load.

### E. Cost Optimization

- Autoscaling min/max boundaries avoid overprovisioning.
- Focused alarms reduce noisy monitoring overhead.
- Canary schedule reduced to daily to cut run frequency.
- S3 lifecycle deletes canary artifacts after 1 day.
- Compression and caching reduce network and compute cost.
- Effectiveness: pays for needed capacity instead of constant high baseline.

### F. Sustainability

- Autoscaling uses resources only when needed.
- Compression lowers data transfer and compute effort.
- Fewer redundant frontend calls reduce backend work.
- Short retention for synthetic artifacts reduces unnecessary storage.
- Effectiveness: lower infrastructure energy footprint with same business output.

## 5. Evidence You Can Mention in Presentation

- Autoscaling policy is configured for ALB request count on ECS service.
- Alarm set is intentionally simplified to business-critical indicators:
- Included alarm: ALB 5xx.
- Included alarm: ECS CPU high.
- Included alarm: ECS memory high.
- Canary now runs daily (not every minute).
- Canary artifact bucket has 1-day lifecycle expiration.
- Terraform plan is clean after apply (infrastructure converged state).

## 6. Suggested Speaker Split (You + Colleague)

- Speaker 1 covers problem statement, architecture overview, Operational Excellence, Security, and Reliability.
- Speaker 2 covers Performance Efficiency, Cost Optimization, Sustainability, and final trade-offs.

## 7. Trade-offs and Future Improvements (Good Q&A material)

- Current trade-off: frontend is served with backend for simplicity.
- Future improvement: move frontend to S3 + CloudFront for better CDN offload and lower backend load.
- Future improvement: add HTTPS listener + certificate and redirect HTTP to HTTPS.
- Future improvement: move Terraform state to remote backend with locking for team workflows.

## 8. One-line Conclusion

- We built on AWS (ECS Fargate, ALB, RDS, WAF, CloudWatch, SNS, SSM), kept authentication custom for product-level flexibility, and aligned every choice with the 6 pillars to keep the system scalable, secure, observable, and cost-aware.
