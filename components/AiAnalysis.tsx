
import React, { useState } from 'react';
import { HandResult } from '../types';
import { analyzeShoe } from '../services/geminiService';

interface AiAnalysisProps {
  history: HandResult[];
}

const AiAnalysis: React.FC<AiAnalysisProps> = ({ history }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeShoe(history);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-theme-panel border border-theme-border p-4 shadow-xl flex flex-col rounded-none h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-theme-brand text-xs font-bold uppercase tracking-widest">AI Pattern Analysis</h3>
        <button 
          onClick={handleAnalyze}
          disabled={loading || history.length < 10}
          className="px-3 py-1 bg-theme-brand text-black text-[10px] font-bold uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      <div className="flex-grow overflow-auto">
        {!analysis && !loading ? (
          <div className="h-full flex items-center justify-center text-gray-600 text-xs italic text-center px-8">
            {history.length < 10 
              ? 'Complete at least 10 hands to enable AI shoe insights.' 
              : 'Click "Run Analysis" to get Gemini\'s perspective on this shoe.'}
          </div>
        ) : loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-2 bg-theme-border rounded w-3/4"></div>
            <div className="h-2 bg-theme-border rounded w-5/6"></div>
            <div className="h-2 bg-theme-border rounded w-2/3"></div>
          </div>
        ) : (
          <div className="text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-line">
            {analysis}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAnalysis;
