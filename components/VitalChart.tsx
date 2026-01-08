import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { LabResult } from '../types';

interface VitalChartProps {
  title: string;
  data: LabResult[];
  color: string;
  unit: string;
}

export const VitalChart: React.FC<VitalChartProps> = ({ title, data, color, unit }) => {
  if (data.length === 0) return (
    <div className="h-64 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
      Sin datos históricos para {title}
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title} <span className="text-slate-400 font-normal">({unit})</span></h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={10} 
              tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
            />
            <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              dot={{ r: 3, fill: color }} 
              activeDot={{ r: 5 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};