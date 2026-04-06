output "app_url" {
  description = "Public URL of the deployed application (via ALB)"
  value       = "http://${aws_lb.app.dns_name}"
}

output "ecr_image" {
  description = "Full ECR image URI that is running"
  value       = "${data.aws_ecr_repository.app.repository_url}:${var.image_tag}"
}

output "ecs_cluster" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for container logs"
  value       = aws_cloudwatch_log_group.app.name
}

output "waf_web_acl_arn" {
  description = "ARN of the WAFv2 Web ACL protecting the ALB"
  value       = aws_wafv2_web_acl.app.arn
}

output "waf_log_group" {
  description = "CloudWatch log group for WAF request logs (empty when logging is disabled)"
  value       = var.enable_waf_logging ? aws_cloudwatch_log_group.waf[0].name : ""
}

output "alarms_sns_topic_arn" {
  description = "SNS topic ARN receiving CloudWatch alarm notifications"
  value       = aws_sns_topic.alarms.arn
}

output "operations_dashboard_name" {
  description = "CloudWatch operations dashboard name"
  value       = aws_cloudwatch_dashboard.operations.dashboard_name
}

output "synthetics_canary_name" {
  description = "CloudWatch synthetics canary name"
  value       = aws_synthetics_canary.health.name
}

output "synthetics_healthcheck_url" {
  description = "URL checked by the synthetics canary"
  value       = local.synthetics_healthcheck_url
}
