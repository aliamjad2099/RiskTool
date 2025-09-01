import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RiskTrend: React.FC = () => {
  // Mock trend data - will be replaced with real data
  const trendData = [
    { month: 'Jan', inherentRisk: 8.2, residualRisk: 5.1 },
    { month: 'Feb', inherentRisk: 8.5, residualRisk: 5.3 },
    { month: 'Mar', inherentRisk: 8.1, residualRisk: 4.9 },
    { month: 'Apr', inherentRisk: 7.8, residualRisk: 4.6 },
    { month: 'May', inherentRisk: 7.9, residualRisk: 4.7 },
    { month: 'Jun', inherentRisk: 7.6, residualRisk: 4.4 },
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={[0, 10]} />
          <Tooltip 
            formatter={(value: number, name: string) => [
              value.toFixed(1), 
              name === 'inherentRisk' ? 'Inherent Risk' : 'Residual Risk'
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="inherentRisk" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="inherentRisk"
          />
          <Line 
            type="monotone" 
            dataKey="residualRisk" 
            stroke="#10b981" 
            strokeWidth={2}
            name="residualRisk"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskTrend;
