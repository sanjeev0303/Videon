locals {
  name     = "videon-prod"
  nats_url = "nats://${var.motionmesh_nats_private_ip}:4222"

  redis_url = "redis://${var.motionmesh_redis_endpoint}:6379/0"

  database_url = "postgres://${var.db_username}:${var.db_password}@${module.aurora.cluster_endpoint}:${module.aurora.cluster_port}/${var.db_name}?sslmode=require"

  s3_bucket_name = "videon-production-${data.aws_caller_identity.current.account_id}"

  cors_allowed_origins = ["https://${var.domain_name}", "https://${var.api_domain}"]

  public_api_url = "https://${var.api_domain}/api/v1"
  frontend_url   = "https://${var.domain_name}"
}