import express, { Request, Response } from 'express';
import pino from 'pino';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

app.use(express.json());

// ==========================================
// MOCK SERVICES
// ==========================================
const mockSageMakerCheckFormality = async (text: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500)); 
  if (text.includes('ไอแก่')) return false;
  return true;
};

const mockBedrockRewrite = async (text: string, tone: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (tone === 'สุภาพทางการ') return 'สวัสดีครับ/ค่ะ ผู้ใหญ่ที่เคารพ';
  if (tone === 'เป็นกันเอง') return 'สวัสดีครับคุณลุง';
  return `สวัสดีครับ (ปรับโทน: ${tone})`;
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

    const isFormal = await mockSageMakerCheckFormality(message);

    // [เพิ่มใหม่] เงื่อนไขการเก็บ Log: เก็บเฉพาะตอนที่เป็น Formal
    if (isFormal) {
      await saveDashboardLog({
        type: 'FORMAL_MESSAGE',
        originalMessage: message,
        isFormal: true
      });
    }

    return res.json({ isFormal, originalMessage: message });

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

// ==========================================
// START SERVER
// ==========================================
const server = app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});