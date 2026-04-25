# ==========================================
# Stage 1: Builder (สำหรับต้ม TypeScript)
# ==========================================
FROM node:20-alpine AS builder

# กำหนดโฟลเดอร์ทำงานใน Container
WORKDIR /app

# ก๊อปปี้แค่ package.json มาก่อน เพื่อใช้ Cache ของ Docker ให้เป็นประโยชน์
COPY package*.json ./

# ติดตั้ง Dependencies ทั้งหมด (รวมถึง devDependencies อย่าง typescript)
RUN npm install

# ก๊อปปี้โค้ดทั้งหมด (ยกเว้นสิ่งที่อยู่ใน .dockerignore)
COPY . .

# สั่ง Compile TypeScript ให้กลายเป็น JavaScript (ไฟล์จะไปอยู่ในโฟลเดอร์ dist/)
RUN npx tsc

# ==========================================
# Stage 2: Production (สำหรับรันจริง)
# ==========================================
FROM node:20-alpine AS production

WORKDIR /app

# ตั้งค่า Environment ว่านี่คือ Production
ENV NODE_ENV=production

# ก๊อปปี้ package.json อีกรอบ
COPY package*.json ./

# ติดตั้งเฉพาะ Dependencies ที่ใช้รันจริง (--omit=dev จะไม่ลง typescript เพื่อลดขนาด)
RUN npm install --omit=dev

# ก๊อปปี้เฉพาะโฟลเดอร์ dist/ ที่ Compile เสร็จแล้วมาจาก Stage 1
COPY --from=builder /app/dist ./dist

# [Security Best Practice] เปลี่ยนไปใช้ user 'node' แทน 'root'
USER node

# แจ้งว่า Container นี้จะเปิดพอร์ต 3000
EXPOSE 3000

# คำสั่งตอนรัน Container (ใช้ node ธรรมดา รันไฟล์ JS)
CMD ["node", "dist/index.js"]