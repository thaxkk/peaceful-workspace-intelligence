import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import MetricCard from '../components/MetricCard'
import ChartCard from '../components/ChartCard'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts'
import { getLogs } from '../services/api';

const COLORS = ['#64868E', '#98b4a6']
export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  

  useEffect(() => {

    const fetchMyLogs = async () => {
      try {
        const data = await getLogs(); 
        setLogs(data);               
      } catch (error) {
        console.log('ว้า... โหลดข้อมูลไม่สำเร็จ', error);
      }
    };

    fetchMyLogs();
  }, []); 

  // ====== metrics ======
  const total = logs.length
  const impoliteCount = logs.filter(l => !l.isFormal).length
  const politeCount = logs.filter(l => l.isFormal).length
  const impoliteRate = Math.round((impoliteCount / total) * 100)

  // most used tone
  const toneCount = logs
    .filter(l => l.appliedTone)
    .reduce((acc, l) => {
      acc[l.appliedTone] = (acc[l.appliedTone] || 0) + 1
      return acc
    }, {})
  const mostUsedTone = Object.entries(toneCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

  // pie data
  const pieData = [
    { name: 'Impolite', value: impoliteCount },
    { name: 'Polite', value: politeCount },
  ]

  // tone bar data
  const toneData = Object.entries(toneCount).map(([tone, count]) => ({ tone, count }))

  // line — messages over time
  const lineData = logs.map(l => ({
    time: new Date(l.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    messages: 1,
    type: l.isFormal ? 'Polite' : 'Impolite'
  }))

  // hour bar
  const hourCount = logs.reduce((acc, l) => {
    const hour = new Date(l.timestamp).getHours() + ':00'
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {})
  const hourData = Object.entries(hourCount)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([hour, count]) => ({ hour, count }))

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#eef5f0' }}>
      <Navbar />

      <div className="flex-1 px-4 py-6 pt-13">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
            Communication Analytics
          </p>

          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Total Messages"
              value={total}
            />
            <MetricCard
              label="Impolite Rate"
              value={`${impoliteRate}%`}
              sub={`${impoliteCount} of ${total} messages`}
            />
            <MetricCard
              label="Most Used Tone"
              value={mostUsedTone}
              sub={`${toneCount[mostUsedTone] || 0} times`}
            />
          </div>

          {/* Pie + Tone */}
          <div className="grid grid-cols-2 gap-4">
            <ChartCard title="Polite vs Impolite">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tone Distribution">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={toneData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="tone" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#64868E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Messages per Hour */}
          <ChartCard title="Messages per Hour">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#98b4a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </div>
    </div>
  )
}