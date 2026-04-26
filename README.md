# 🕊️ Peaceful Workspace Intelligence

An AI-powered workplace communication assistant that detects toxic or impolite messages and rewrites them into professional, friendly, or concise alternatives — available in both Thai and English.

---

## ✨ Features

- **Formality Detection** — Classifies messages as polite or toxic using a HuggingFace model deployed on AWS SageMaker
- **AI Rewriting** — Rewrites toxic messages into three tones (Formal, Friendly, Concise) using Claude via AWS Bedrock
- **Analytics Dashboard** — Visualizes communication patterns: polite/impolite ratio, tone distribution, and activity over time
- **Playlist Page** — Embeds Spotify or YouTube playlists to set the mood while working
- **Bilingual Support** — Works seamlessly with both Thai and English input

---

## 🏗️ Architecture

User (Browser)│▼Frontend (React + Vite)        ← Hosted on S3 / served via Nginx (Docker)│▼ REST APIBackend (Express + TypeScript)  ← ECS Fargate (private subnet, behind ALB)├── /api/check-formality    → AWS SageMaker (xlmr-large-toxicity-classifier)├── /api/rewrite            → AWS Bedrock (Claude 4.5)└── /api/logs               → AWS CloudWatch Logs
Infrastructure is provisioned with **OpenTofu (Terraform)** and includes VPC, subnets, NAT gateway, ALB, ECS Fargate, SageMaker serverless endpoint, and CloudWatch.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Recharts, React Router |
| Backend | Node.js, Express 5, TypeScript 6 |
| AI — Toxicity Detection | HuggingFace `textdetox/xlmr-large-toxicity-classifier` on AWS SageMaker Serverless |
| AI — Rewriting | Anthropic Claude Haiku 4.5 via AWS Bedrock |
| Logging | AWS CloudWatch Logs + Pino |
| Infrastructure | OpenTofu, AWS ECS Fargate, ALB, VPC, NAT Gateway |
| Containerization | Docker (multi-stage builds), Nginx |

---

## 📁 Project Structure

.├── backend/              # Express + TypeScript API server│   ├── src/index.ts      # Main app entry point│   ├── Dockerfile│   └── tsconfig.json│├── frontend/             # React + Vite SPA│   ├── src/│   │   ├── pages/        # Landing, Analyze, Playlist, Dashboard│   │   ├── components/   # Reusable UI components│   │   └── services/     # API client (axios)│   ├── Dockerfile│   └── nginx.conf│├── ml/                   # Python ML utilities│   ├── bedrock/          # Bedrock rewriter script│   └── sagemaker_module/ # SageMaker deploy + inference scripts│└── tofu/                 # Infrastructure as Code (OpenTofu)├── main.tf└── variables.tf
---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- AWS credentials configured (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- Docker (for containerized deployment)

### Backend (Local Development)

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Fill in: AWS_REGION, SAGEMAKER_ENDPOINT_NAME, BEDROCK_MODEL_ID,
#          FRIEND_BEDROCK_ACCESS_KEY, FRIEND_BEDROCK_SECRET_KEY

npx ts-node src/index.ts
The server starts on http://localhost:3000.Frontend (Local Development)Bashcd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3000" > .env

npm run dev
The app starts on http://localhost:5173.🐳 Docker Build & Push to AWS ECRTo deploy the backend to AWS ECS Fargate, you need to build the Docker image and push it to Amazon Elastic Container Registry (ECR).1. Build the local image:Bashcd backend
docker build -t peaceful-workspace-backend .
2. Create an ECR Repository:(You only need to do this once. Make sure your AWS CLI is configured with the correct region).Bashaws ecr create-repository \
  --repository-name peaceful-workspace-backend \
  --region ap-southeast-1
3. Authenticate Docker to your Amazon ECR registry:Replace <YOUR_AWS_ACCOUNT_ID> with your actual 12-digit AWS account ID.Bashaws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com
4. Tag your image to match your ECR repository:Bashdocker tag peaceful-workspace-backend:latest <YOUR_AWS_ACCOUNT_ID>[.dkr.ecr.ap-southeast-1.amazonaws.com/peaceful-workspace-backend:latest](https://.dkr.ecr.ap-southeast-1.amazonaws.com/peaceful-workspace-backend:latest)
5. Push the image to AWS ECR:Bashdocker push <YOUR_AWS_ACCOUNT_ID>[.dkr.ecr.ap-southeast-1.amazonaws.com/peaceful-workspace-backend:latest](https://.dkr.ecr.ap-southeast-1.amazonaws.com/peaceful-workspace-backend:latest)
Note: After pushing, grab the full Image URI (e.g., <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/peaceful-workspace-backend:latest) and update the app_image_url variable in your OpenTofu configuration before applying the infrastructure.☁️ Infrastructure Deployment (OpenTofu)Bashcd tofu

tofu init

tofu apply
After apply, the ALB DNS URL will be printed as output — use it as your VITE_API_URL.🔌 API ReferenceGET /healthReturns server status.POST /api/check-formalityChecks whether a message is polite or toxic.Request:JSON{ "message": "ทำไมทำงานห่วยแบบนี้" }
Response:JSON{ "isFormal": false, "originalMessage": "ทำไมทำงานห่วยแบบนี้" }
POST /api/rewriteRewrites a message in the specified tone.Request:JSON{ "message": "ทำไมทำงานห่วยแบบนี้", "tone": "friendly" }
Response:JSON{ "rewrittenMessage": "งานส่วนนี้ยังต้องปรับปรุงอีกนิดหน่อยนะคะ", "appliedTone": "friendly" }
Available tones: formal, friendly, conciseGET /api/logsFetches analytics events from CloudWatch (last 7 days).⚙️ Environment VariablesBackend (.env)VariableDescriptionPORTServer port (default: 3000)AWS_REGIONAWS region (default: ap-southeast-1)SAGEMAKER_ENDPOINT_NAMEName of the deployed SageMaker endpointBEDROCK_MODEL_IDBedrock model ID (default: anthropic.claude-3-sonnet-20240229-v1:0)CLOUDWATCH_LOG_GROUPCloudWatch log group (default: /ecs/cloud-backend-app)FRIEND_BEDROCK_ACCESS_KEYAWS Access Key for BedrockFRIEND_BEDROCK_SECRET_KEYAWS Secret Key for BedrockFrontend (.env)VariableDescriptionVITE_API_URLBackend API base URL🤖 ML ModelThe toxicity detection model is textdetox/xlmr-large-toxicity-classifier from HuggingFace, deployed as a SageMaker Serverless Endpoint with 3 GB memory and up to 5 concurrent invocations.Labels returned:neutral → message is polite ✅toxic → message is impolite, triggers rewrite flow ⚠️📊 DashboardThe Dashboard page pulls logs from CloudWatch and visualizes:Total messages analyzedImpolite rate (%)Most used rewrite tonePolite vs Impolite pie chartTone distribution bar chartMessages per hour heatmap📄 LicenseMIT