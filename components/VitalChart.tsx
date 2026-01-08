
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
    <div className="h-64 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 text-sm font-medium">
      Sin datos históricos para {title}
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-6 flex justify-between items-center">
          {title} 
          <span className="text-slate-400 font-medium text-xs bg-slate-50 px-2 py-1 rounded">{unit}</span>
      </h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
            />
            <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
              itemStyle={{ color: color }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} 
              activeDot={{ r: 6, fill: color, stroke: '#fff' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
