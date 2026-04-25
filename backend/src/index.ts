import express, { Request, Response } from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import cors from 'cors';
import { SageMakerRuntimeClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

app.use(cors());
app.use(express.json());

const sagemakerClient = new SageMakerRuntimeClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-southeast-1', 
  credentials: {
        accessKeyId: process.env.FRIEND_BEDROCK_ACCESS_KEY as string,
        secretAccessKey: process.env.FRIEND_BEDROCK_SECRET_KEY as string
  } });
  const cloudWatchClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const LOG_GROUP_NAME = process.env.CLOUDWATCH_LOG_GROUP || '/ecs/cloud-backend-app';

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal: `You are a professional workplace text rewriter.
CRITICAL RULES:
1. EXACT LANGUAGE MATCHING: You MUST output in the exact same language as the original text. (English input = English output, Thai input = Thai output).
2. PRESERVE CORE INTENT: Keep the original meaning exactly. If the user complains about work quality, keep the focus on work quality. Do not change it to difficulty or unrelated topics.
3. REMOVE TOXICITY: Replace insults, slurs, and aggressive words with polite, professional equivalents. 
4. NO HALLUCINATION: Do not add context, apologies, or extra questions that do not exist in the original text.
5. ONLY OUTPUT THE REWRITTEN TEXT: No introductory phrases like "Here is..." or "I will help...". No email sign-offs.`,

  friendly: `You are a polite and collaborative workmate rewriter.
CRITICAL RULES:
1. EXACT LANGUAGE MATCHING: You MUST output in the exact same language as the original text. (English input = English output, Thai input = Thai output).
2. PRESERVE CORE INTENT: Keep the original message but soften the tone. For example, "This work is stupid" -> "This part of the work still needs some adjustments."
3. REMOVE TOXICITY: Strip out all insults and aggressive words. 
4. NO AI/THERAPIST BEHAVIOR: Do not offer emotional support, do not say "I understand," and do not say "I will help you rewrite this." Just provide the rewritten sentence as a normal colleague.
5. ONLY OUTPUT THE REWRITTEN TEXT: No conversational fillers or explanations.`,

  concise: `You are a concise workplace text rewriter.
CRITICAL RULES:
1. EXACT LANGUAGE MATCHING: You MUST output in the exact same language as the original text.
2. KEEP IT SHORT & PRESERVE INTENT: Remove all insults and summarize the core message politely and directly.
3. NO EXTRA CONTENT: Do not add offers to help.
4. ONLY OUTPUT THE REWRITTEN TEXT.`,
};

const mockSageMakerCheckFormality = async (text: string): Promise<any> => {
  const command = new InvokeEndpointCommand({
    EndpointName: process.env.SAGEMAKER_ENDPOINT_NAME!,
    ContentType: 'application/json',
    Body: Buffer.from(JSON.stringify({ inputs: text })),
  });

  const response = await sagemakerClient.send(command);
  const result = JSON.parse(Buffer.from(response.Body!).toString('utf-8'));

  const score = result[0].score;
  const isFormal = result[0].label !== 'toxic';
  
  return { isFormal, score };
};

const mockBedrockRewrite = async (text: string, tone: string): Promise<string> => {
  const toneMap: Record<string, string> = {
    formal: 'formal',
    friendly: 'friendly',
    concise: 'concise',
  };
  const mappedTone = toneMap[tone] ?? 'formal';
  const systemPrompt = TONE_INSTRUCTIONS[mappedTone];

  const command = new InvokeModelCommand({
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: Buffer.from(JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: `REWRITE THIS: "${text}"` }],
    })),
  });

  const response = await bedrockClient.send(command);
  const result = JSON.parse(Buffer.from(response.body).toString('utf-8'));
  return result.content[0].text;
};

// ==========================================
// DASHBOARD LOGGING SERVICE (เพิ่มใหม่)
// ==========================================
const saveDashboardLog = async (logData: any) => {
  // พ่น Log ออก stdout เป็นรูปแบบ JSON (เหมาะสำหรับ AWS CloudWatch นำไปทำ Dashboard)
  logger.info({ 
    event: 'DASHBOARD_ANALYTICS', 
    timestamp: new Date().toISOString(),
    ...logData 
  });

  // TODO: ในอนาคตสามารถเพิ่มโค้ดเพื่อเซฟลง Database (เช่น DynamoDB หรือ MongoDB) ตรงนี้ได้
  // await myDatabase.insert(logData);
};

// ==========================================
// API ENDPOINTS
// ==========================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

// Path 1: ตรวจสอบความสุภาพ
app.post('/api/check-formality', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'กรุณาส่ง message มาด้วย' });

    const { isFormal, score } = await mockSageMakerCheckFormality(message);

    // [เพิ่มใหม่] เงื่อนไขการเก็บ Log: เก็บเฉพาะตอนที่เป็น Formal
    if (isFormal) {
      await saveDashboardLog({
        type: 'FORMAL_MESSAGE',
        originalMessage: message,
        isFormal: true,
        score: score
      });
    }

    return res.json({ isFormal, originalMessage: message,  });

  } catch (error) {
    logger.error({ err: error, msg: 'Error in check-formality' });
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อความ' });
  }
});

// Path 2: แปลงข้อความตามโทน
app.post('/api/rewrite', async (req: Request, res: Response) => {
  try {
    const { message, tone } = req.body;
    if (!message || !tone) return res.status(400).json({ error: 'กรุณาส่ง message และ tone' });

    const rewrittenMessage = await mockBedrockRewrite(message, tone);

    // [เพิ่มใหม่] เงื่อนไขการเก็บ Log: เก็บข้อมูลที่ผ่านการแปลงแล้วทั้งหมด
    await saveDashboardLog({
      type: 'REWRITTEN_MESSAGE',
      originalMessage: message,
      rewrittenMessage: rewrittenMessage,
      appliedTone: tone,
      isFormal: false
    });

    return res.json({ rewrittenMessage, appliedTone: tone });

  } catch (error) {
    logger.error({ err: error, msg: 'Error in rewrite' });
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแปลงข้อความ' });
  }
});

app.get('/api/logs', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    let allEvents: any[] = [];
    let nextToken: string | undefined = undefined;

    // [เพิ่มใหม่] กำหนดเวลาดึงข้อมูลย้อนหลัง 7 วัน (ป้องกัน API โหลดช้าถ้า Log เยอะเกิน)
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 7);

    // [เพิ่มใหม่] วนลูปดึงข้อมูลทุกหน้า จนกว่า nextToken จะหมด (แก้ปัญหา Log มาไม่ครบ)
    do {
      const queryParams = {
        logGroupName: LOG_GROUP_NAME,
        filterPattern: '{ $.event = "DASHBOARD_ANALYTICS" }', 
        startTime: startTime.getTime(),
        nextToken: nextToken,
      };

      // @ts-ignore : ปิดการแจ้งเตือน TS ของบรรทัดนี้ทิ้งไปเลย และบังคับให้เป็น any
      const fetchCommand = new FilterLogEventsCommand(queryParams) as any;
      
      const response: any = await cloudWatchClient.send(fetchCommand);
      
      if (response.events) {
        allEvents = allEvents.concat(response.events);
      }
      
      nextToken = response.nextToken;
    } while (nextToken);

    if (allEvents.length === 0) {
      return res.json([]);
    }

    let formattedLogs = allEvents.map(event => {
      try {
        const logData = JSON.parse(event.message || '{}');
        return {
          timestamp: logData.timestamp || new Date(event.timestamp!).toISOString(),
          type: logData.type || null,
          originalMessage: logData.originalMessage || null,
          rewrittenMessage: logData.rewrittenMessage || null,
          appliedTone: logData.appliedTone || null,
          isFormal: logData.isFormal ?? false,
          score: logData.score || null
        };
      } catch (e) {
        return null;
      }
    }).filter(item => item !== null);

    // เรียงลำดับจากเก่าไปใหม่ล่าสุด
    formattedLogs.sort((a, b) => new Date(a!.timestamp).getTime() - new Date(b!.timestamp).getTime());

    return res.json(formattedLogs);

  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      logger.warn('Log group not found. Returning mock data for frontend testing.');
      return res.json([
        {
          timestamp: new Date().toISOString(),
          type: "REWRITTEN_MESSAGE",
          originalMessage: "ไอแก่บ้าน้ำลาย",
          rewrittenMessage: "คุณลุงพูดเยอะจังเลยครับ",
          appliedTone: "friendly",
          isFormal: false,
          score: null
        }
      ]);
    }

    logger.error({ err: error, msg: 'Error fetching logs from CloudWatch' });
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Log ได้' });
  }
});

// ==========================================
// START SERVER
// ==========================================
const server = app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});