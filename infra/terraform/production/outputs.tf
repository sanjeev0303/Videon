output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "api_url" {
  value = "https://${var.api_domain}"
}

output "client_url" {
  value = "https://${var.domain_name}"
}

output "aurora_endpoint" {
  value = module.aurora.cluster_endpoint
}

output "aurora_reader_endpoint" {
  value = module.aurora.reader_endpoint
}

output "redis_endpoint" {
  value = var.motionmesh_redis_endpoint
}

output "nats_private_ip" {
  value = var.motionmesh_nats_private_ip
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}

output "s3_bucket_region" {
  value = module.s3.bucket_region
}

output "server_instance_ids" {
  value = module.server.instance_ids
}

output "client_instance_ids" {
  value = module.client.instance_ids
}

output "acm_certificate_arn" {
  value = aws_acm_certificate.main.arn
}