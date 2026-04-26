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
    ├── /api/rewrite            → AWS Bedrock (Claude Haiku 4.5)
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
| AI — Rewriting | Anthropic Claude Haiku 4.5 (`global.anthropic.claude-haiku-4-5-20251001-v1:0`) via AWS Bedrock |
| Logging | AWS CloudWatch Logs + Pino |
| Infrastructure | OpenTofu, AWS ECS Fargate, ALB, VPC, NAT Gateway |
| Containerization | Docker (multi-stage builds), Nginx |

---

## 📁 Project Structure

```
.
├── backend/                    # Express + TypeScript API server
│   ├── src/
│   │   └── index.ts            # Main app entry point (all routes)
│   ├── Dockerfile              # Multi-stage build (builder → production)
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx     # Hero / start page
│   │   │   ├── Analyze.jsx     # Main chat + tone selector
│   │   │   ├── Playlist.jsx    # Spotify / YouTube embed
│   │   │   └── Dashboard.jsx   # Analytics charts
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── InputBar.jsx
│   │   │   ├── BotBubble.jsx
│   │   │   ├── ToneSelector.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   └── ChartCard.jsx
│   │   └── services/
│   │       └── api.js          # Axios API client
│   ├── Dockerfile              # Nginx-served production build
│   ├── nginx.conf
│   └── vite.config.js
│
├── ml/                         # Python ML utilities
│   ├── bedrock/
│   │   └── rewriter.py         # Bedrock Claude rewrite script
│   └── sagemaker_module/
│       ├── deploy_endpoint.py  # Deploy HuggingFace model to SageMaker
│       ├── inference.py        # Invoke SageMaker endpoint
│       └── test_sagemaker.py   # Local model testing
│
└── tofu/                       # Infrastructure as Code (OpenTofu)
    ├── main.tf                 # VPC, ALB, ECS, SageMaker, CloudWatch
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

**Frontend:**
```bash
cd frontend
docker build --build-arg VITE_API_URL=http://your-alb-url -t peaceful-workspace-frontend .
docker run -p 80:80 peaceful-workspace-frontend
```

---

## ☁️ Infrastructure Deployment (OpenTofu)

```bash
cd tofu

tofu init
tofu plan -var="app_image_url=<ECR_IMAGE_URL>" \
          -var="friend_bedrock_access_key=<KEY>" \
          -var="friend_bedrock_secret_key=<SECRET>"

tofu apply
```

After apply, the ALB DNS URL will be printed as output — use it as your `VITE_API_URL`.

> **Note:** The `cloudwatch_log_group` variable defaults to `/ecs/peaceful-workspace` (matches the log group created by OpenTofu). The `bedrock_model_id` defaults to `global.anthropic.claude-haiku-4-5-20251001-v1:0`.

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

Fetches all `DASHBOARD_ANALYTICS` events from CloudWatch Logs for the last 7 days, with full pagination support.

**Behavior:**
- Queries CloudWatch using filter pattern `{ $.event = "DASHBOARD_ANALYTICS" }`
- Automatically paginates through all result pages using `nextToken` until all events are retrieved
- Results are sorted oldest → newest by timestamp
- Sets `Cache-Control: no-store` headers to always return fresh data
- If the CloudWatch log group does not exist (`ResourceNotFoundException`), returns a single mock entry for frontend testing

**Response:**
```json
[
  {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "type": "REWRITTEN_MESSAGE",
    "originalMessage": "ทำไมทำงานห่วยแบบนี้",
    "rewrittenMessage": "งานส่วนนี้ยังต้องปรับปรุงอีกนิดหน่อยนะคะ",
    "appliedTone": "friendly",
    "isFormal": false,
    "score": null
  },
  {
    "timestamp": "2024-01-15T11:00:00.000Z",
    "type": "FORMAL_MESSAGE",
    "originalMessage": "Please review this document.",
    "rewrittenMessage": null,
    "appliedTone": null,
    "isFormal": true,
    "score": 0.97
  }
]
```

**Response fields:**

| Field | Type | Description |
|---|---|---|
| `timestamp` | `string` | ISO 8601 timestamp of the event |
| `type` | `string` | `"REWRITTEN_MESSAGE"` or `"FORMAL_MESSAGE"` |
| `originalMessage` | `string` | The original input message |
| `rewrittenMessage` | `string \| null` | Rewritten output (only for `REWRITTEN_MESSAGE`) |
| `appliedTone` | `string \| null` | `formal`, `friendly`, or `concise` (only for rewrites) |
| `isFormal` | `boolean` | Whether the original message was classified as polite |
| `score` | `number \| null` | Confidence score from SageMaker (only for formal messages) |

**What gets logged:**
- `FORMAL_MESSAGE` — logged when `/api/check-formality` classifies a message as polite (`isFormal: true`)
- `REWRITTEN_MESSAGE` — logged every time `/api/rewrite` produces a rewritten message

**Fallback (mock data)** — returned when the CloudWatch log group doesn't exist yet:
```json
[
  {
    "timestamp": "<current time>",
    "type": "REWRITTEN_MESSAGE",
    "originalMessage": "ไอแก่บ้าน้ำลาย",
    "rewrittenMessage": "คุณลุงพูดเยอะจังเลยครับ",
    "appliedTone": "friendly",
    "isFormal": false,
    "score": null
  }
]
```

---

## ⚙️ Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `3000`) |
| `AWS_REGION` | AWS region (default: `ap-southeast-1`) |
| `SAGEMAKER_ENDPOINT_NAME` | Name of the deployed SageMaker endpoint |
| `BEDROCK_MODEL_ID` | Bedrock model ID (default: `global.anthropic.claude-haiku-4-5-20251001-v1:0`) |
| `CLOUDWATCH_LOG_GROUP` | CloudWatch log group (default: `/ecs/peaceful-workspace`) |
| `FRIEND_BEDROCK_ACCESS_KEY` | AWS Access Key for Bedrock |
| `FRIEND_BEDROCK_SECRET_KEY` | AWS Secret Key for Bedrock |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |

---

## ⚙️ How It Works

### End-to-End Flow

#### Path 1 — Message is Polite 

```
User types message
        │
        ▼
POST /api/check-formality
        │
        ▼
SageMaker invokes xlmr-large-toxicity-classifier
        │
        ▼
Returns label: "neutral" → isFormal: true
        │
        ▼
Backend logs FORMAL_MESSAGE event to CloudWatch
        │
        ▼
Frontend shows: "สุภาพมากคับ บบ（づ￣3￣）づ╭💖～"
```

#### Path 2 — Message is Impolite, User Rewrites 

```
User types message
        │
        ▼
POST /api/check-formality
        │
        ▼
SageMaker returns label: "toxic" → isFormal: false
        │
        ▼
Frontend shows tone selector: [🏢 formal] [😊 friendly] [⚡ concise]
        │
        ▼  (user picks a tone)
POST /api/rewrite  { message, tone }
        │
        ▼
Backend builds a tone-specific system prompt (see TONE_INSTRUCTIONS)
and calls AWS Bedrock → Claude Haiku 4.5
        │
        ▼
Claude rewrites the message — same language in, same language out
(Thai input → Thai output, English input → English output)
        │
        ▼
Backend logs REWRITTEN_MESSAGE event to CloudWatch
        │
        ▼
Frontend shows rewritten message + "Try another tone?" buttons
```

### Tone System

Each tone applies a strict system prompt to Claude:

| Tone | Behavior |
|---|---|
| `formal` | Professional rewrite, preserves exact intent, no extra apologies or filler |
| `friendly` | Softens the message like a colleague would, no therapist-speak |
| `concise` | Strips insults, summarizes the core point politely in as few words as possible |

All tones share the same critical rules: language matching (Thai stays Thai), intent preservation, and zero hallucination.

### Analytics Pipeline

Every API call writes a structured JSON log entry via Pino to stdout, which ECS/Fargate forwards to CloudWatch Logs:

```
POST /api/check-formality  (isFormal: true)
    → CloudWatch event: { event: "DASHBOARD_ANALYTICS", type: "FORMAL_MESSAGE", ... }

POST /api/rewrite
    → CloudWatch event: { event: "DASHBOARD_ANALYTICS", type: "REWRITTEN_MESSAGE", ... }
```

The Dashboard page calls `GET /api/logs`, which paginates through all CloudWatch events from the last 7 days and aggregates them into charts showing polite/impolite ratio, tone usage, and hourly activity.

---

## 🤖 ML Model

The toxicity detection model is [`textdetox/xlmr-large-toxicity-classifier`](https://huggingface.co/textdetox/xlmr-large-toxicity-classifier) from HuggingFace, deployed as a **SageMaker Serverless Endpoint** with 3 GB memory and up to 5 concurrent invocations.

> The HuggingFace container image used: `763104351884.dkr.ecr.ap-southeast-1.amazonaws.com/huggingface-pytorch-inference:2.1.0-transformers4.37.0-cpu-py310-ubuntu22.04`

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
