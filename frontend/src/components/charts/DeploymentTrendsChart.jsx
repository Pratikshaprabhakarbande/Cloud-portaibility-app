import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard.jsx';

export default function DeploymentTrendsChart({ data = [] }) {
  return (
    <ChartCard title="Deployment Trends" subtitle="Successful vs failed deployments (last 7 days)">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="success" name="Success" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="failed" name="Failed" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
