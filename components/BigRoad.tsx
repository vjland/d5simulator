
import React from 'react';
import { HandResult, Winner, Bead } from '../types';

interface BigRoadProps {
  history: HandResult[];
}

const BigRoad: React.FC<BigRoadProps> = ({ history }) => {
  const ROWS = 6;
  const COLS = 60; // High density columns
  const CELL_SIZE = 14; // Smaller cells for high density

  const grid = React.useMemo(() => {
    // 1. Process ties into beads
    const beads: Bead[] = [];
    let currentTieCount = 0;

    history.forEach(hand => {
      if (hand.winner === Winner.TIE) {
        currentTieCount++;
      } else {
        beads.push({ winner: hand.winner, tieCount: currentTieCount });
        currentTieCount = 0;
      }
    });

    // 2. Initialize grid
    const tempGrid: (Bead | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    if (beads.length === 0) return tempGrid;

    let currRow = 0;
    let currCol = 0;
    let prevWinner: Winner | null = null;
    
    // Tracking for "dragon" tails
    // We need to know where the last bead was placed to handle same-winner sequences
    let lastR = 0;
    let lastC = 0;

    beads.forEach((bead, index) => {
      if (index === 0) {
        tempGrid[0][0] = bead;
        lastR = 0;
        lastC = 0;
        prevWinner = bead.winner;
        return;
      }

      if (bead.winner === prevWinner) {
        // Try to go down
        let nextR = lastR + 1;
        let nextC = lastC;

        // If at bottom or cell is occupied, go right (dragon)
        if (nextR >= ROWS || tempGrid[nextR][nextC] !== null) {
          nextR = lastR;
          nextC = lastC + 1;
        }

        // Safety check for grid bounds
        if (nextC < COLS) {
          tempGrid[nextR][nextC] = bead;
          lastR = nextR;
          lastC = nextC;
        }
      } else {
        // Winner changed: Find the first column that has an empty row 0
        let nextC = lastC + 1;
        // Search from left for the first completely empty column at row 0 starting after the first column
        // Standard baccarat road moves to the next column top row
        // But we must ensure we don't land on a dragon tail from a previous sequence
        let foundCol = 0;
        for (let c = 0; c < COLS; c++) {
           let colBusy = false;
           // If row 0 is occupied, this column started a sequence already
           if (tempGrid[0][c] !== null) continue;
           
           // Look for the first column where row 0 is null AND it's to the right of 
           // the start of the previous sequence or just the next available
           // Simplified: find the first empty row 0 after the previous sequence's start column
           // but actually, just find the first empty row 0 from the left that is >= current Column
           // but most roads just move to the next column.
        }
        
        // Practical approach for Baccarat logic:
        // Find the first column where Row 0 is empty, starting from the current column or column 0
        let targetC = 0;
        while (targetC < COLS && tempGrid[0][targetC] !== null) {
          targetC++;
        }
        
        if (targetC < COLS) {
          tempGrid[0][targetC] = bead;
          lastR = 0;
          lastC = targetC;
        }
      }
      prevWinner = bead.winner;
    });

    return tempGrid;
  }, [history, COLS]);

  // Reverse the columns for display if we want to see the latest on the right
  // Or just let it scroll. We'll stick to fixed left-to-right with scrolling.
  
  return (
    <div className="bg-theme-panel border border-theme-border p-3 shadow-xl flex flex-col rounded-none h-full overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-theme-brand text-[10px] font-bold uppercase tracking-widest">Big Road (High Density)</h3>
        <div className="flex gap-3 text-[9px] text-gray-500 font-mono">
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full border border-red-500"></div> B</div>
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full border border-blue-500"></div> P</div>
          <div className="flex items-center gap-1"><div className="w-1 h-1 bg-green-500"></div> T</div>
        </div>
      </div>
      
      <div className="flex-grow overflow-x-auto overflow-y-hidden border border-theme-border bg-black/40 scrollbar-thin">
        <div 
          className="inline-grid bg-black/20"
          style={{ 
            gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
            gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
          }}
        >
          {/* Transpose the grid for CSS Grid layout (row-major) */}
          {Array.from({ length: ROWS }).map((_, r) => (
            Array.from({ length: COLS }).map((_, c) => {
              const cell = grid[r][c];
              return (
                <div 
                  key={`${r}-${c}`} 
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                  className="border-r border-b border-theme-border/50 flex items-center justify-center relative box-border"
                >
                  {cell && (
                    <div 
                      className={`rounded-full border ${
                        cell.winner === Winner.PLAYER ? 'border-blue-500' : 'border-red-500'
                      } relative`}
                      style={{ width: CELL_SIZE - 4, height: CELL_SIZE - 4, borderWidth: '1.5px' }}
                    >
                      {cell.tieCount > 0 && (
                        <div 
                          className="absolute -top-0.5 -right-0.5 bg-green-500 rounded-full border border-black" 
                          style={{ width: '4px', height: '4px' }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
};

export default BigRoad;
