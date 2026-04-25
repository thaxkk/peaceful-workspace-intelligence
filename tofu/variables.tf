variable "aws_region" {
  description = "AWS Region ที่ต้องการ Deploy ระบบ"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "ชื่อโปรเจกต์ (ใช้ตั้งชื่อ Resource ต่างๆ)"
  type        = string
  default     = "peaceful-workspace"
}

variable "vpc_cidr" {
  description = "CIDR Block สำหรับ VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "container_port" {
  description = "Port ที่แอป Node.js ใช้งาน"
  type        = number
  default     = 3000
}

variable "app_image_url" {
  description = "URL ของ Docker Image ใน ECR (รวม tag :latest)"
  type        = string
}

variable "bedrock_model_id" {
  description = "ID ของ Model ใน Bedrock"
  type        = string
  default     = "global.anthropic.claude-haiku-4-5-20251001-v1:0"
}

variable "friend_bedrock_access_key" {
  description = "Access Key ของเพื่อน"
  type        = string
  sensitive   = true 
}

variable "friend_bedrock_secret_key" {
  description = "Secret Key ของเพื่อน"
  type        = string
  sensitive   = true
}

variable "cloudwatch_log_group" {
  description = "log_group_path"
  type        = string
  default     = "/ecs/peaceful-workspace"
}