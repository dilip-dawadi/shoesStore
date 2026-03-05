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
  description = "CloudWatch log group for WAF request logs"
  value       = aws_cloudwatch_log_group.waf.name
}
