locals {
  custom_domain_enabled = var.enable_custom_domain && trimspace(var.root_domain) != "" && trimspace(var.subdomain) != ""
  custom_domain_fqdn    = local.custom_domain_enabled ? "${trimspace(var.subdomain)}.${trimspace(var.root_domain)}" : ""
  cloudflare_zone_id_effective = trimspace(var.cloudflare_zone_id) != "" ? trimspace(var.cloudflare_zone_id) : (
    local.custom_domain_enabled ? data.cloudflare_zone.selected[0].id : ""
  )
}

data "cloudflare_zone" "selected" {
  count = local.custom_domain_enabled && trimspace(var.cloudflare_zone_id) == "" ? 1 : 0

  name = trimspace(var.root_domain)
}

resource "aws_acm_certificate" "app" {
  count             = local.custom_domain_enabled ? 1 : 0
  domain_name       = local.custom_domain_fqdn
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "cloudflare_record" "acm_validation" {
  for_each = local.custom_domain_enabled ? {
    for dvo in aws_acm_certificate.app[0].domain_validation_options : dvo.domain_name => {
      name    = dvo.resource_record_name
      type    = dvo.resource_record_type
      content = dvo.resource_record_value
    }
  } : {}

  zone_id = local.cloudflare_zone_id_effective
  name    = trimsuffix(each.value.name, ".")
  type    = each.value.type
  content = trimsuffix(each.value.content, ".")
  ttl     = 120
  proxied = false

  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "app" {
  count           = local.custom_domain_enabled ? 1 : 0
  certificate_arn = aws_acm_certificate.app[0].arn

  validation_record_fqdns = [
    for dvo in aws_acm_certificate.app[0].domain_validation_options : dvo.resource_record_name
  ]

  depends_on = [cloudflare_record.acm_validation]
}

resource "cloudflare_record" "app" {
  count   = local.custom_domain_enabled ? 1 : 0
  zone_id = local.cloudflare_zone_id_effective
  name    = trimspace(var.subdomain)
  type    = "CNAME"
  content = aws_lb.app.dns_name
  proxied = var.cloudflare_proxied
  ttl     = var.cloudflare_proxied ? 1 : var.cloudflare_dns_ttl

  allow_overwrite = true
}