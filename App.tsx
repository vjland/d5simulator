
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BaccaratEngine } from './services/baccaratEngine';
import { HandResult, SimulationState, Winner } from './types';
import PerformanceChart from './components/PerformanceChart';
import BigRoad from './components/BigRoad';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    active: false,
    history: [],
    balance: 0,
    speed: 1000,
  });

  const [activeTab, setActiveTab] = useState<'perf' | 'road' | 'log'>('perf');
  
  const engineRef = useRef(new BaccaratEngine());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopSimulation = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setState(prev => ({ ...prev, active: false }));
  }, []);

  const dealOneHand = useCallback(() => {
    const engine = engineRef.current;
    if (!engine.hasCards()) {
      stopSimulation();
      return;
    }

    setState(prev => {
      const result = engine.dealNextHand(prev.history, prev.balance);
      if (!result) {
        stopSimulation();
        return prev;
      }
      return {
        ...prev,
        history: [...prev.history, result],
        balance: result.runningBalance,
      };
    });
  }, [stopSimulation]);

  const startSimulation = useCallback(() => {
    setState(prev => ({ ...prev, active: true }));
  }, []);

  const resetShoe = useCallback(() => {
    stopSimulation();
    engineRef.current.initShoe();
    setState(prev => ({
      ...prev,
      history: [],
      balance: 0,
      active: false,
    }));
  }, [stopSimulation]);

  const fastForward = useCallback(() => {
    stopSimulation();
    const engine = engineRef.current;
    
    setState(prev => {
      let currentBalance = prev.balance;
      const newHistory = [...prev.history];
      
      while (engine.hasCards()) {
        const result = engine.dealNextHand(newHistory, currentBalance);
        if (!result) break;
        newHistory.push(result);
        currentBalance = result.runningBalance;
      }
      
      return {
        ...prev,
        history: newHistory,
        balance: currentBalance,
        active: false,
      };
    });
  }, [stopSimulation]);

  useEffect(() => {
    if (state.active) {
      timerRef.current = setTimeout(dealOneHand, state.speed);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.active, state.history.length, state.speed, dealOneHand]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-theme-base font-sans selection:bg-theme-brand selection:text-black">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-theme-border bg-theme-panel p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">
            D5<span className="text-theme-brand">SIM</span>
          </h1>
          <div className="hidden md:flex gap-4 ml-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <div className="flex flex-col">
              <span>Balance</span>
              <span className={`text-sm ${state.balance >= 0 ? 'text-theme-brand' : 'text-red-500'}`}>
                {state.balance > 0 ? '+' : ''}{state.balance} Units
              </span>
            </div>
            <div className="flex flex-col border-l border-theme-border pl-4">
              <span>Hands</span>
              <span className="text-sm text-white">{state.history.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={state.speed} 
            onChange={(e) => setState(prev => ({ ...prev, speed: parseInt(e.target.value) }))}
            className="bg-black border border-theme-border text-xs text-gray-400 p-1 px-2 focus:outline-none focus:border-theme-brand"
          >
            <option value={1500}>Speed: Slow</option>
            <option value={800}>Speed: Normal</option>
            <option value={100}>Speed: Turbo</option>
          </select>
          
          <div className="flex bg-black border border-theme-border h-8 overflow-hidden">
            <button 
              onClick={() => state.active ? stopSimulation() : startSimulation()}
              className={`px-6 flex items-center justify-center transition-colors ${state.active ? 'text-red-500 hover:bg-red-500/10' : 'text-theme-brand hover:bg-theme-brand/10'}`}
            >
              {state.active ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="16"/></svg>
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              )}
            </button>
            <button 
              onClick={fastForward}
              className="px-4 flex items-center justify-center border-l border-theme-border hover:bg-theme-brand hover:text-black transition-colors"
              title="Fast Forward to End"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>
              </svg>
            </button>
            <button 
              onClick={resetShoe}
              className="px-4 flex items-center justify-center border-l border-theme-border hover:bg-red-500 hover:text-white transition-colors"
              title="Reset Shoe"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Tabs (Mobile Bottom / Desktop Left) */}
        <nav className="flex-shrink-0 bg-theme-panel border-r border-theme-border flex md:flex-col overflow-auto md:w-16">
          {[
            { id: 'perf', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', label: 'Perf' },
            { id: 'road', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: 'Road' },
            { id: 'log', icon: 'M4 6h16M4 12h16m-7 6h7', label: 'Log' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 md:flex-none h-16 flex flex-col items-center justify-center transition-all ${
                activeTab === tab.id ? 'bg-theme-brand text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
              </svg>
              <span className="text-[8px] font-bold uppercase mt-1">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <section className="flex-grow p-4 overflow-hidden flex flex-col gap-4">
          <div className="flex-grow min-h-0">
            {activeTab === 'perf' && <PerformanceChart history={state.history} />}
            {activeTab === 'road' && <BigRoad history={state.history} />}
            {activeTab === 'log' && (
              <div className="h-full bg-theme-panel border border-theme-border flex flex-col overflow-hidden">
                <div className="p-4 border-b border-theme-border flex justify-between items-center">
                   <h3 className="text-theme-brand text-xs font-bold uppercase tracking-widest">Game Log</h3>
                   <span className="text-[10px] text-gray-500 font-mono">Showing {state.history.length} hands</span>
                </div>
                <div className="flex-grow overflow-auto">
                  <table className="w-full text-left text-xs text-gray-400 border-collapse">
                    <thead className="bg-black text-gray-500 uppercase font-bold sticky top-0">
                      <tr>
                        <th className="p-3 border-b border-theme-border">#</th>
                        <th className="p-3 border-b border-theme-border">Result</th>
                        <th className="p-3 border-b border-theme-border text-center">Score</th>
                        <th className="p-3 border-b border-theme-border text-center">Δ</th>
                        <th className="p-3 border-b border-theme-border text-center">Bet</th>
                        <th className="p-3 border-b border-theme-border text-right">Sum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...state.history].reverse().map((h) => (
                        <tr key={h.id} className="border-b border-theme-border hover:bg-white/5 transition-colors group">
                          <td className="p-3 font-mono text-gray-600">{h.id}</td>
                          <td className="p-3">
                            <span className={`font-bold mr-2 ${h.winner === Winner.PLAYER ? 'text-blue-500' : h.winner === Winner.BANKER ? 'text-red-500' : 'text-green-500'}`}>
                              {h.winner.substring(0, 1)}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded-sm ${h.outcome === 'WIN' ? 'bg-theme-brand text-black' : h.outcome === 'LOSS' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                              {h.outcome}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono">
                            {h.playerScore} - {h.bankerScore}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {Math.abs(h.playerScore - h.bankerScore)}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {h.betPlaced ? (
                              <span className={h.betPlaced === Winner.PLAYER ? 'text-blue-500' : 'text-red-500'}>
                                {h.betPlaced.substring(0, 1)}
                              </span>
                            ) : '-'}
                          </td>
                          <td className={`p-3 text-right font-mono font-bold ${h.runningBalance > 0 ? 'text-theme-brand' : h.runningBalance < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                            {h.runningBalance > 0 ? '+' : ''}{h.runningBalance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick stats footer for desktop */}
          <div className="hidden md:grid grid-cols-4 gap-4 h-20 flex-shrink-0">
            {[
               { label: 'Banker Wins', value: state.history.filter(h => h.winner === Winner.BANKER).length, color: 'text-red-400' },
               { label: 'Player Wins', value: state.history.filter(h => h.winner === Winner.PLAYER).length, color: 'text-blue-400' },
               { label: 'Win Rate (D5)', value: state.history.filter(h => h.outcome === 'WIN').length > 0 ? `${((state.history.filter(h => h.outcome === 'WIN').length / state.history.filter(h => h.outcome !== 'NO_BET' && h.outcome !== 'PUSH').length) * 100).toFixed(1)}%` : '0%', color: 'text-theme-brand' },
               { label: 'Max Drawdown', value: `${Math.min(0, ...state.history.map(h => h.runningBalance))} Units`, color: 'text-gray-400' }
            ].map((stat, i) => (
              <div key={i} className="bg-theme-panel border border-theme-border p-3 flex flex-col justify-center">
                <span className="text-[8px] uppercase font-bold text-gray-600 tracking-tighter">{stat.label}</span>
                <span className={`text-lg font-black ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
