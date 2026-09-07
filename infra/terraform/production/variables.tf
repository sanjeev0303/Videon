variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

# Hosted zone that actually exists in Route 53 (videon is a subdomain of it)
variable "zone_name" {
  type        = string
  default     = "motionmesh.co.in"
  description = "Route 53 hosted zone to create records in (parent of domain_name)"
}

variable "domain_name" {
  type        = string
  default     = "videon.motionmesh.co.in"
  description = "Public domain for the client dashboard"
}

variable "api_domain" {
  type        = string
  default     = "api.videon.motionmesh.co.in"
  description = "Public domain for the API server"
}

variable "vpc_cidr" {
  type    = string
  default = "10.30.0.0/16"
}

variable "azs" {
  type    = list(string)
  default = ["ap-south-1a", "ap-south-1b"]
}

variable "db_name" {
  type    = string
  default = "videon"
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "aurora_instance_class" {
  type    = string
  default = "db.t4g.medium"
}

variable "api_instance_type" {
  type    = string
  default = "t3.medium"
}

variable "client_instance_type" {
  type    = string
  default = "t3.small"
}

variable "key_name" {
  type        = string
  default     = ""
  description = "Optional EC2 key pair for SSH (blank = SSM Session Manager only)"
}

variable "github_repository" {
  type    = string
  default = "https://github.com/sanjeev0303/videon.git"
}

variable "github_branch" {
  type    = string
  default = "main"
}

# Sibling repo the server deploys with (builds @motionmesh/storage via file: dep)
variable "motionmesh_repository" {
  type        = string
  default     = "https://github.com/sanjeev0303/motionmesh.git"
  description = "Repo cloned beside /opt/videon; server depends on its storage SDK"
}

# ─── Motionmesh peering (shared NATS + Redis) ────────────────────────────────

variable "motionmesh_vpc_id" {
  type        = string
  description = "ID of the motionmesh production VPC (10.20.0.0/16)"
}

variable "motionmesh_vpc_cidr" {
  type        = string
  default     = "10.20.0.0/16"
  description = "CIDR of the motionmesh production VPC"
}

variable "motionmesh_nats_private_ip" {
  type        = string
  description = "Private IP of motionmesh-prod-nats"
}

variable "motionmesh_redis_endpoint" {
  type        = string
  description = "Primary endpoint of motionmesh-prod ElastiCache"
}

# ─── Secrets (supply in terraform.tfvars / env) ──────────────────────────────

variable "clerk_publishable_key" {
  type      = string
  sensitive = true
}

variable "clerk_secret_key" {
  type      = string
  sensitive = true
}

variable "redis_key_secret" {
  type      = string
  sensitive = true
}

variable "analytics_jwt_secret" {
  type      = string
  sensitive = true
}

variable "videon_api_key" {
  type        = string
  sensitive   = true
  description = "Server-side key the client uses to talk to the videon API"
}

variable "motionmesh_api_key" {
  type      = string
  sensitive = true
}

variable "motionmesh_bucket_id" {
  type      = string
  sensitive = true
}

variable "motionmesh_transcode_bucket_id" {
  type      = string
  sensitive = true
}

variable "motionmesh_base_url" {
  type    = string
  default = "https://api.motionmesh.co.in/v1"
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
}

variable "stripe_price_starter" {
  type      = string
  sensitive = true
}

variable "stripe_price_pro" {
  type      = string
  sensitive = true
}

variable "stripe_price_business" {
  type      = string
  sensitive = true
}