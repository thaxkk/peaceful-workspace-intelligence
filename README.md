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

```
User (Browser)
    │
    ▼
Frontend (React + Vite)        ← Hosted on S3 / served via Nginx (Docker)
    │
    ▼ REST API
Backend (Express + TypeScript)  ← ECS Fargate (private subnet, behind ALB)
    ├── /api/check-formality    → AWS SageMaker (xlmr-large-toxicity-classifier)
    ├── /api/rewrite            → AWS Bedrock (Claude 3)
    └── /api/logs               → AWS CloudWatch Logs
```

Infrastructure is provisioned with **OpenTofu (Terraform)** and includes VPC, subnets, NAT gateway, ALB, ECS Fargate, SageMaker serverless endpoint, and CloudWatch.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Recharts, React Router |
| Backend | Node.js, Express 5, TypeScript 6 |
| AI — Toxicity Detection | HuggingFace `textdetox/xlmr-large-toxicity-classifier` on AWS SageMaker Serverless |
| AI — Rewriting | Anthropic Claude 3 (Sonnet / Haiku) via AWS Bedrock |
| Logging | AWS CloudWatch Logs + Pino |
| Infrastructure | OpenTofu, AWS ECS Fargate, ALB, VPC, NAT Gateway |
| Containerization | Docker (multi-stage builds), Nginx |

---

## 📁 Project Structure

```
.
├── backend/              # Express + TypeScript API server
│   ├── src/index.ts      # Main app entry point
│   ├── Dockerfile
│   └── tsconfig.json
│
├── frontend/             # React + Vite SPA
│   ├── src/
│   │   ├── pages/        # Landing, Analyze, Playlist, Dashboard
│   │   ├── components/   # Reusable UI components
│   │   └── services/     # API client (axios)
│   ├── Dockerfile
│   └── nginx.conf
│
├── ml/                   # Python ML utilities
│   ├── bedrock/          # Bedrock rewriter script
│   └── sagemaker_module/ # SageMaker deploy + inference scripts
│
└── tofu/                 # Infrastructure as Code (OpenTofu)
    ├── main.tf
    └── variables.tf
```

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
```

The server starts on `http://localhost:3000`.

### Frontend (Local Development)

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3000" > .env

npm run dev
```

The app starts on `http://localhost:5173`.

---

## 🐳 Docker Build

**Backend:**
```bash
cd backend
docker build -t peaceful-workspace-backend .
```

---

## ☁️ Infrastructure Deployment (OpenTofu)

```bash
cd tofu

tofu init

tofu apply
```

After apply, the ALB DNS URL will be printed as output — use it as your `VITE_API_URL`.

---

## 🔌 API Reference

### `GET /health`
Returns server status.

### `POST /api/check-formality`
Checks whether a message is polite or toxic.

**Request:**
```json
{ "message": "ทำไมทำงานห่วยแบบนี้" }
```

**Response:**
```json
{ "isFormal": false, "originalMessage": "ทำไมทำงานห่วยแบบนี้" }
```

### `POST /api/rewrite`
Rewrites a message in the specified tone.

**Request:**
```json
{ "message": "ทำไมทำงานห่วยแบบนี้", "tone": "friendly" }
```

**Response:**
```json
{ "rewrittenMessage": "งานส่วนนี้ยังต้องปรับปรุงอีกนิดหน่อยนะคะ", "appliedTone": "friendly" }
```

Available tones: `formal`, `friendly`, `concise`

### `GET /api/logs`
Fetches analytics events from CloudWatch (last 7 days).

---

## ⚙️ Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `3000`) |
| `AWS_REGION` | AWS region (default: `ap-southeast-1`) |
| `SAGEMAKER_ENDPOINT_NAME` | Name of the deployed SageMaker endpoint |
| `BEDROCK_MODEL_ID` | Bedrock model ID (default: `anthropic.claude-3-sonnet-20240229-v1:0`) |
| `CLOUDWATCH_LOG_GROUP` | CloudWatch log group (default: `/ecs/cloud-backend-app`) |
| `FRIEND_BEDROCK_ACCESS_KEY` | AWS Access Key for Bedrock |
| `FRIEND_BEDROCK_SECRET_KEY` | AWS Secret Key for Bedrock |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |

---

## 🤖 ML Model

The toxicity detection model is [`textdetox/xlmr-large-toxicity-classifier`](https://huggingface.co/textdetox/xlmr-large-toxicity-classifier) from HuggingFace, deployed as a **SageMaker Serverless Endpoint** with 3 GB memory and up to 5 concurrent invocations.

Labels returned:
- `neutral` → message is polite ✅
- `toxic` → message is impolite, triggers rewrite flow ⚠️

---

## 📊 Dashboard

The Dashboard page pulls logs from CloudWatch and visualizes:

- **Total messages analyzed**
- **Impolite rate** (%)
- **Most used rewrite tone**
- **Polite vs Impolite pie chart**
- **Tone distribution bar chart**
- **Messages per hour heatmap**

---

## 📄 License

MIT
