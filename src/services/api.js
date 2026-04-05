import axios from 'axios'

const API_URL = 'http://localhost:3000'

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