import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard.jsx';

export default function ResourceUtilizationChart({ data = [] }) {
  return (
    <ChartCard title="Resource Utilization" subtitle="CPU / Memory / Network over 24h (%)">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
          <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="cpu" name="CPU" stroke="#2563eb" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="memory" name="Memory" stroke="#7c3aed" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="network" name="Network" stroke="#0891b2" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
