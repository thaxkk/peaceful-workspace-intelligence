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

variable "sagemaker_images" {
  type = map(string)
  default = {
    "ap-southeast-1" = "763104351884.dkr.ecr.ap-southeast-1.amazonaws.com/huggingface-pytorch-inference:2.1.0-transformers4.37.0-cpu-py310-ubuntu22.04"
    "us-east-1"      = "763104351884.dkr.ecr.us-east-1.amazonaws.com/huggingface-pytorch-inference:2.1.0-transformers4.32.2-cpu-py310-ubuntu22.04"
    "ap-northeast-1" = "763104351884.dkr.ecr.ap-northeast-1.amazonaws.com/huggingface-pytorch-inference:2.1.0-transformers4.32.2-cpu-py310-ubuntu22.04"
    # เพิ่ม Region อื่นๆ ได้ตามต้อง
  }
}

variable "bedrock_model_id" {
  description = "ID ของ Model ใน Bedrock"
  type        = string
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
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