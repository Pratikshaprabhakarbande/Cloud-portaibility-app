import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard.jsx';

export default function CostTrendsChart({ data = [] }) {
  return (
    <ChartCard title="Cost Trends" subtitle="Monthly spend by provider (USD)">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="aws" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff9900" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ff9900" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="azure" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0078d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gcp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34a853" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#34a853" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => `$${v}`} contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="aws" name="AWS" stroke="#ff9900" fill="url(#aws)" strokeWidth={2} />
          <Area type="monotone" dataKey="azure" name="Azure" stroke="#0078d4" fill="url(#azure)" strokeWidth={2} />
          <Area type="monotone" dataKey="gcp" name="GCP" stroke="#34a853" fill="url(#gcp)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
