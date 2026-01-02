
import { BaccaratEngine, Winner } from './engine.js';

// State
const state = {
    active: false,
    history: [],
    balance: 0,
    speed: 800,
    activeTab: 'perf'
};

const engine = new BaccaratEngine();
let timer = null;
let chart = null;

// DOM Elements
const elements = {
    statBalance: document.getElementById('stat-balance'),
    statHands: document.getElementById('stat-hands'),
    statBanker: document.getElementById('stat-banker'),
    statPlayer: document.getElementById('stat-player'),
    statWinrate: document.getElementById('stat-winrate'),
    statDrawdown: document.getElementById('stat-drawdown'),
    logBody: document.getElementById('log-body'),
    logCount: document.getElementById('log-count'),
    roadContainer: document.getElementById('road-container'),
    btnToggle: document.getElementById('btn-toggle'),
    iconPlay: document.getElementById('icon-play'),
    iconStop: document.getElementById('icon-stop'),
    btnFF: document.getElementById('btn-ff'),
    btnReset: document.getElementById('btn-reset'),
    simSpeed: document.getElementById('sim-speed')
};

// --- Chart Initialization ---
function initChart() {
    const ctx = document.getElementById('chart-performance').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Units',
                data: [{ x: 0, y: 0 }],
                borderColor: '#A3D78A',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: 85,
                    grid: { color: 'transparent', borderColor: '#171717' },
                    ticks: { color: '#4b5563', font: { size: 10 } }
                },
                y: {
                    min: -20,
                    max: 20,
                    grid: { color: '#171717', borderColor: '#171717' },
                    ticks: { color: '#4b5563', font: { size: 10 } }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#0a0a0a',
                    borderColor: '#171717',
                    borderWidth: 1,
                    titleColor: '#A3D78A',
                    bodyColor: '#A3D78A'
                }
            }
        }
    });
}

// --- Road Rendering ---
function renderBigRoad() {
    const ROWS = 6;
    const COLS = 60;
    elements.roadContainer.innerHTML = '';
    
    // Process beads
    const beads = [];
    let currentTieCount = 0;
    state.history.forEach(h => {
        if (h.winner === Winner.TIE) currentTieCount++;
        else {
            beads.push({ winner: h.winner, tieCount: currentTieCount });
            currentTieCount = 0;
        }
    });

    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let lastR = 0, lastC = 0, prevWinner = null;

    beads.forEach((bead, idx) => {
        if (idx === 0) {
            grid[0][0] = bead;
            prevWinner = bead.winner;
        } else {
            if (bead.winner === prevWinner) {
                let nextR = lastR + 1;
                let nextC = lastC;
                if (nextR >= ROWS || grid[nextR][nextC] !== null) {
                    nextR = lastR;
                    nextC = lastC + 1;
                }
                if (nextC < COLS) {
                    grid[nextR][nextC] = bead;
                    lastR = nextR;
                    lastC = nextC;
                }
            } else {
                let targetC = 0;
                while (targetC < COLS && grid[0][targetC] !== null) targetC++;
                if (targetC < COLS) {
                    grid[0][targetC] = bead;
                    lastR = 0;
                    lastC = targetC;
                }
            }
            prevWinner = bead.winner;
        }
    });

    const fragment = document.createDocumentFragment();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'road-cell';
            const bead = grid[r][c];
            if (bead) {
                const b = document.createElement('div');
                b.className = `road-bead border-${bead.winner === Winner.PLAYER ? 'blue-500' : 'red-500'}`;
                if (bead.tieCount > 0) {
                    const t = document.createElement('div');
                    t.className = 'road-tie-dot';
                    b.appendChild(t);
                }
                cell.appendChild(b);
            }
            fragment.appendChild(cell);
        }
    }
    elements.roadContainer.appendChild(fragment);
}

// --- Updates ---
function updateUI() {
    // Stats
    elements.statBalance.textContent = `${state.balance > 0 ? '+' : ''}${state.balance} Units`;
    elements.statBalance.className = `text-sm ${state.balance >= 0 ? 'text-theme-brand' : 'text-red-500'}`;
    elements.statHands.textContent = state.history.length;
    
    const bankers = state.history.filter(h => h.winner === Winner.BANKER).length;
    const players = state.history.filter(h => h.winner === Winner.PLAYER).length;
    const wins = state.history.filter(h => h.outcome === 'WIN').length;
    const totalBets = state.history.filter(h => h.outcome !== 'NO_BET' && h.outcome !== 'PUSH').length;
    const winRate = totalBets > 0 ? ((wins / totalBets) * 100).toFixed(1) : 0;
    const drawdown = Math.min(0, ...state.history.map(h => h.runningBalance));

    elements.statBanker.textContent = bankers;
    elements.statPlayer.textContent = players;
    elements.statWinrate.textContent = `${winRate}%`;
    elements.statDrawdown.textContent = `${drawdown} Units`;

    // Chart
    if (chart) {
        const chartData = [{ x: 0, y: 0 }];
        let validSteps = 0;
        state.history.forEach(h => {
            if (h.winner !== Winner.TIE) {
                validSteps++;
                chartData.push({ x: validSteps, y: h.runningBalance });
            }
        });
        chart.data.datasets[0].data = chartData;
        chart.update();
    }

    // Road (Only update if visible for perf)
    if (state.activeTab === 'road') renderBigRoad();

    // Log (Only first few rows or full if visible)
    if (state.activeTab === 'log') renderLog();
    elements.logCount.textContent = `${state.history.length} hands`;
}

function renderLog() {
    const html = state.history.slice().reverse().map(h => `
        <tr class="border-b border-theme-border hover:bg-white/5 transition-colors">
            <td class="p-3 font-mono text-gray-600">${h.id}</td>
            <td class="p-3">
                <span class="font-bold mr-2 ${h.winner === Winner.PLAYER ? 'text-blue-500' : h.winner === Winner.BANKER ? 'text-red-500' : 'text-green-500'}">
                    ${h.winner[0]}
                </span>
                <span class="text-[10px] px-1.5 py-0.5 font-bold rounded-sm ${h.outcome === 'WIN' ? 'bg-theme-brand text-black' : h.outcome === 'LOSS' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}">
                    ${h.outcome}
                </span>
            </td>
            <td class="p-3 text-center font-mono">${h.playerScore} - ${h.bankerScore}</td>
            <td class="p-3 text-center font-mono">${Math.abs(h.playerScore - h.bankerScore)}</td>
            <td class="p-3 text-center font-bold">
                ${h.betPlaced ? `<span class="${h.betPlaced === Winner.PLAYER ? 'text-blue-500' : 'text-red-500'}">${h.betPlaced[0]}</span>` : '-'}
            </td>
            <td class="p-3 text-right font-mono font-bold ${h.runningBalance > 0 ? 'text-theme-brand' : h.runningBalance < 0 ? 'text-red-500' : 'text-gray-500'}">
                ${h.runningBalance > 0 ? '+' : ''}${h.runningBalance}
            </td>
        </tr>
    `).join('');
    elements.logBody.innerHTML = html;
}

// --- Simulation Logic ---
function dealHand() {
    if (!engine.hasCards()) {
        stopSim();
        return;
    }
    const result = engine.dealNextHand(state.history, state.balance);
    if (!result) {
        stopSim();
        return;
    }
    state.history.push(result);
    state.balance = result.runningBalance;
    updateUI();
    if (state.active) timer = setTimeout(dealHand, state.speed);
}

function startSim() {
    state.active = true;
    elements.iconPlay.classList.add('hidden');
    elements.iconStop.classList.remove('hidden');
    dealHand();
}

function stopSim() {
    state.active = false;
    if (timer) clearTimeout(timer);
    elements.iconPlay.classList.remove('hidden');
    elements.iconStop.classList.add('hidden');
}

// --- Events ---
elements.btnToggle.addEventListener('click', () => {
    state.active ? stopSim() : startSim();
});

elements.btnFF.addEventListener('click', () => {
    stopSim();
    while (engine.hasCards()) {
        const result = engine.dealNextHand(state.history, state.balance);
        if (!result) break;
        state.history.push(result);
        state.balance = result.runningBalance;
    }
    updateUI();
});

elements.btnReset.addEventListener('click', () => {
    stopSim();
    engine.initShoe();
    state.history = [];
    state.balance = 0;
    updateUI();
});

elements.simSpeed.addEventListener('change', (e) => {
    state.speed = parseInt(e.target.value);
});

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        state.activeTab = tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
        btn.classList.add('active-tab');
        
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(`panel-${tab}`).classList.remove('hidden');
        
        updateUI();
    });
});

// Init
initChart();
updateUI();
