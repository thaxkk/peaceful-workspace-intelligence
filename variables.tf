variable "aws_region" {
  default = "ap-southeast-1"
}

variable "project_name" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "container_port" {
  type    = number
  default = 3000
}

variable "app_image_tag" {
  type    = string
  default = "latest"
}

variable "aws_access_key" {
  description = "AWS Access Key for testing"
  type        = string
  sensitive   = true # อันนี้สำคัญมาก Tofu จะไม่พ่น Key ออกมาใน Log
}

variable "aws_secret_key" {
  description = "AWS Secret Key for testing"
  type        = string
  sensitive   = true
}
