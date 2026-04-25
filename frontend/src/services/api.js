import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL;

// ขั้นที่ 1: เช็คว่าสุภาพไหม
export const checkFormality = async (message) => {
  const res = await axios.post(`${API_URL}/api/check-formality`, { message })
  return res.data
}

// ขั้นที่ 2: rewrite ตาม tone ที่เลือก
export const rewriteMessage = async (message, tone) => {
  const res = await axios.post(`${API_URL}/api/rewrite`, { message, tone })
  return res.data
}

export const getLogs = async () => {
  try {
    const response = await fetch(`${API_URL}/api/logs`);
    
    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูล Logs ได้');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error; // โยน error กลับไปให้คนเรียกจัดการต่อ
  }
};