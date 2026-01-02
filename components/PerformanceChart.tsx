
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { HandResult, Winner } from '../types';

interface PerformanceChartProps {
  history: HandResult[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ history }) => {
  // Filter out ties for a smoother balance curve if desired, 
  // or just use cumulative points.
  const chartData = React.useMemo(() => {
    const data = [{ index: 0, balance: 0 }];
    let validSteps = 0;
    history.forEach((hand) => {
        if (hand.winner !== Winner.TIE) {
            validSteps++;
            data.push({
                index: validSteps,
                balance: hand.runningBalance
            });
        }
    });
    return data;
  }, [history]);

  return (
    <div className="w-full h-full min-h-[300px] p-4 bg-theme-panel border border-theme-border rounded-none overflow-hidden">
      <h3 className="text-theme-brand text-xs font-bold uppercase mb-4 tracking-widest">Performance Units</h3>
      <div className="w-full h-[calc(100%-2rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
            <XAxis 
              dataKey="index" 
              type="number"
              domain={[0, 85]}
              stroke="#4b5563" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              allowDataOverflow={true}
            />
            <YAxis 
              stroke="#4b5563" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              domain={[-20, 20]}
              allowDataOverflow={true}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #171717', fontSize: '12px' }}
              itemStyle={{ color: '#A3D78A' }}
              labelStyle={{ display: 'none' }}
            />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#A3D78A" 
              strokeWidth={2} 
              dot={false}
              animationDuration={0}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
