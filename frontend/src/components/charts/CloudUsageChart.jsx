import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard.jsx';

const COLORS = { AWS: '#ff9900', Azure: '#0078d4', GCP: '#34a853' };

export default function CloudUsageChart({ data = [] }) {
  return (
    <ChartCard title="Cloud Usage Distribution" subtitle="Share of workloads per provider">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || '#64748b'} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
