
import React, { useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { HandResult, Winner } from '../types';

interface PerformanceChartProps {
  history: HandResult[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ history }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
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

  const handleDownload = () => {
    if (!containerRef.current) return;
    
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    // Clone SVG to modify for export without affecting UI
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('style', 'background-color: #0a0a0a;');
    
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const canvas = document.createElement('canvas');
    const svgSize = svgElement.getBoundingClientRect();
    
    // Higher resolution for export
    const scale = 2;
    canvas.width = svgSize.width * scale;
    canvas.height = svgSize.height * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `d5-performance-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <div className="w-full h-full min-h-[300px] p-4 bg-theme-panel border border-theme-border rounded-sm overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-theme-brand text-xs font-bold uppercase tracking-widest">Performance Units</h3>
        <button 
          onClick={handleDownload}
          title="Download Chart as PNG"
          className="text-theme-control hover:text-white transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
      <div className="flex-grow relative" ref={containerRef}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
            <XAxis 
              dataKey="index" 
              type="number"
              domain={[0, 'dataMax + 10']}
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
              domain={['dataMin - 5', 'dataMax + 5']}
              allowDataOverflow={true}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #171717', fontSize: '12px' }}
              itemStyle={{ color: '#94A378' }}
              labelStyle={{ display: 'none' }}
            />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#94A378" 
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
