
# ==========================================
# 0. Configuration & Data Sources
# ==========================================
provider "aws" {
  region     = var.aws_region
}

data "aws_availability_zones" "available" {
  state = "available"
}

# ==========================================
# 1. Networking (VPC, Dynamic Subnets)
# ==========================================
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "${var.project_name}-vpc" }
}

# Public Subnets (สำหรับ Load Balancer และ NAT)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags = { Name = "${var.project_name}-pub-1" }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true
  tags = { Name = "${var.project_name}-pub-2" }
}

# Private Subnets (สำหรับซ่อนแอป Node.js)
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
  tags = { Name = "${var.project_name}-priv-1" }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]
  tags = { Name = "${var.project_name}-priv-2" }
}

# Gateways & Routing
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "${var.project_name}-igw" }
}

resource "aws_eip" "nat_eip" {
  domain = "vpc"
  tags = { Name = "${var.project_name}-nat-eip" }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_1.id
  depends_on    = [aws_internet_gateway.igw]
  tags = { Name = "${var.project_name}-nat" }
}

resource "aws_route_table" "pub_rt" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "${var.project_name}-pub-rt" }
}

resource "aws_route_table_association" "pub_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.pub_rt.id
}

resource "aws_route_table_association" "pub_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.pub_rt.id
}

resource "aws_route_table" "priv_rt" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = { Name = "${var.project_name}-priv-rt" }
}

resource "aws_route_table_association" "priv_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.priv_rt.id
}

resource "aws_route_table_association" "priv_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.priv_rt.id
}

# ==========================================
# 2. Security Groups
# ==========================================
resource "aws_security_group" "alb_sg" {
  name   = "${var.project_name}-alb-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_sg" {
  name   = "${var.project_name}-ecs-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ==========================================
# 3. ALB (Load Balancer)
# ==========================================
resource "aws_lb" "api_alb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

resource "aws_lb_target_group" "api_tg" {
  name        = "${var.project_name}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  health_check { path = "/health" }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api_alb.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }
}

# ==========================================
# 4. SageMaker (AI Model) & IAM Role
# ==========================================
resource "aws_iam_role" "sagemaker_role" {
  name = "${var.project_name}-sagemaker-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "sagemaker.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "sagemaker_access" {
  role       = aws_iam_role.sagemaker_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
}

# ✅ FIX: สั่งให้ Tofu รอ 30 วินาที เพื่อให้ AWS กระจายสิทธิ์ IAM เสร็จสมบูรณ์
resource "time_sleep" "wait_30_seconds" {
  depends_on      = [aws_iam_role_policy_attachment.sagemaker_access]
  create_duration = "30s"
}

resource "aws_sagemaker_model" "polite_guard" {
  name               = "${var.project_name}-hf-model"
  execution_role_arn = aws_iam_role.sagemaker_role.arn
  
  # ✅ บังคับให้รอ Time Sleep ก่อนเริ่มสร้างโมเดล
  depends_on         = [time_sleep.wait_30_seconds]

  primary_container {
    image = "763104351884.dkr.ecr.${var.aws_region}.amazonaws.com/huggingface-pytorch-inference:2.1.0-transformers4.37.0-cpu-py310-ubuntu22.04" 
    
    environment = {
      HF_MODEL_ID = "textdetox/xlmr-large-toxicity-classifier"
      HF_TASK     = "text-classification"
    }
  }
}

resource "aws_sagemaker_endpoint_configuration" "polite_guard_config" {
  name = "${var.project_name}-endpoint-config"

  production_variants {
    variant_name = "AllTraffic"
    model_name   = aws_sagemaker_model.polite_guard.name
    
    # Serverless Config
    serverless_config {
      max_concurrency   = 5
      memory_size_in_mb = 3072
    }
  }
}

resource "aws_sagemaker_endpoint" "polite_guard_endpoint" {
  name                 = "${var.project_name}-endpoint"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.polite_guard_config.name
}

# ==========================================
# 5. ECS IAM Roles (Bedrock + Marketplace)
# ==========================================
resource "aws_iam_role" "ecs_exec" {
  name = "${var.project_name}-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_exec_attach" {
  role       = aws_iam_role.ecs_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_ai_access" {
  name = "${var.project_name}-ai-access-policy"
  role = aws_iam_role.ecs_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowSageMakerInvoke",
        Effect = "Allow",
        Action = ["sagemaker:InvokeEndpoint"],
        Resource = "*"
      },
      {
        Sid    = "AllowBedrockInvoke",
        Effect = "Allow",
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:ListFoundationModels",
          "bedrock:GetFoundationModel"
        ],
        Resource = "*"
      },
      {
        Sid    = "AllowMarketplaceAccess",
        Effect = "Allow",
        Action = [
          "aws-marketplace:ViewSubscriptions",
          "aws-marketplace:Subscribe"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_cloudwatch_read_access" {
  name = "${var.project_name}-cw-read-policy"
  role = aws_iam_role.ecs_exec.id # ผูกเข้ากับ Role ecs_exec ของคุณเป๊ะๆ

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowCloudWatchLogRead",
        Effect = "Allow",
        Action = [
          "logs:FilterLogEvents",
          "logs:GetLogEvents",
          "logs:DescribeLogStreams"
        ],
        # ใช้ Dynamic ARN ของ Log Group ที่คุณสร้างไว้ด้านล่างได้เลย
        Resource = "${aws_cloudwatch_log_group.logs.arn}:*"
      }
    ]
  })
}

# ==========================================
# 6. ECS Fargate Cluster & Service
# ==========================================
resource "aws_cloudwatch_log_group" "logs" {
  name = "/ecs/${var.project_name}"
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_exec.arn
  task_role_arn            = aws_iam_role.ecs_exec.arn

  container_definitions = jsonencode([{
    name      = "api-container"
    image     = var.app_image_url
    essential = true

    environment = [
      { name = "SAGEMAKER_ENDPOINT_NAME", value = aws_sagemaker_endpoint.polite_guard_endpoint.name },
      { name = "BEDROCK_MODEL_ID",        value = var.bedrock_model_id },
      { name = "AWS_REGION",              value = var.aws_region },
      { name = "LOG_LEVEL",               value = "info" },
      { name = "FRIEND_BEDROCK_ACCESS_KEY", value = var.friend_bedrock_access_key },
      { name = "FRIEND_BEDROCK_SECRET_KEY", value = var.friend_bedrock_secret_key },
      { name = "CLOUDWATCH_LOG_GROUP", value = var.cloudwatch_log_group }
    ]

    portMappings = [{ containerPort = var.container_port, hostPort = var.container_port }]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.logs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "api_svc" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  # ✅ FIX: แยกร่าง Fargate เป็น 2 เครื่อง (AZ A และ AZ B) เพื่อ High Availability 100%
  desired_count   = 2 
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets         = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups = [aws_security_group.ecs_sg.id]
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.api_tg.arn
    container_name   = "api-container"
    container_port   = var.container_port
  }
}

# ==========================================
# 7. Outputs
# ==========================================
output "alb_dns_url" { 
  description = "URL ของ Load Balancer (เอาไปยิง API ผ่าน Postman)"
  value       = "http://${aws_lb.api_alb.dns_name}" 
}

output "sagemaker_endpoint_name" {
  description = "ชื่อของ SageMaker Endpoint"
  value       = aws_sagemaker_endpoint.polite_guard_endpoint.name
}