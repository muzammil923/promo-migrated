import { useState, useRef } from 'react'
import api from '../../apps/frontend/src/api'

function playSound(url) {
  if (!url) return
  try { new Audio(url).play().catch(() => {}) } catch {}
}

function checkWinner(board, winLength) {
  const size = board.length
  const lines = []
  for (let r = 0; r < size; r++)
    for (let c = 0; c <= size - winLength; c++) {
      const line = []
      for (let i = 0; i < winLength; i++) line.push([r, c + i])
      lines.push(line)
    }
  for (let c = 0; c < size; c++)
    for (let r = 0; r <= size - winLength; r++) {
      const line = []
      for (let i = 0; i < winLength; i++) line.push([r + i, c])
      lines.push(line)
    }
  for (let r = 0; r <= size - winLength; r++)
    for (let c = 0; c <= size - winLength; c++) {
      const d1 = [], d2 = []
      for (let i = 0; i < winLength; i++) {
        d1.push([r + i, c + i])
        d2.push([r + i, c + winLength - 1 - i])
      }
      lines.push(d1, d2)
    }
  for (const line of lines) {
    const first = board[line[0][0]][line[0][1]]
    if (!first) continue
    if (line.every(([r, c]) => board[r][c] === first))
      return { winner: first, cells: line }
  }
  return null
}

function isBoardFull(board) {
  return board.every(row => row.every(cell => cell !== null))
}

function getEmptyCells(board) {
  const cells = []
  for (let r = 0; r < board.length; r++)
    for (let c = 0; c < board[r].length; c++)
      if (!board[r][c]) cells.push([r, c])
  return cells
}

function minimax(board, depth, isMaximizing, player, opponent, winLength) {
  const result = checkWinner(board, winLength)
  if (result) return result.winner === opponent ? 10 - depth : depth - 10
  if (isBoardFull(board)) return 0
  const empty = getEmptyCells(board)
  if (isMaximizing) {
    let best = -Infinity
    for (const [r, c] of empty) {
      board[r][c] = opponent
      best = Math.max(best, minimax(board, depth + 1, false, player, opponent, winLength))
      board[r][c] = null
    }
    return best
  } else {
    let best = Infinity
    for (const [r, c] of empty) {
      board[r][c] = player
      best = Math.min(best, minimax(board, depth + 1, true, player, opponent, winLength))
      board[r][c] = null
    }
    return best
  }
}

function greedyScore(board, row, col, who, winLength) {
  board[row][col] = who
  const result = checkWinner(board, winLength)
  board[row][col] = null
  return result ? 100 : 0
}

function getAiMove(board, difficulty, player, opponent, winLength) {
  const empty = getEmptyCells(board)
  if (empty.length === 0) return null
  if (difficulty === 'easy')
    return empty[Math.floor(Math.random() * empty.length)]
  if (difficulty === 'medium' && Math.random() < 0.4)
    return empty[Math.floor(Math.random() * empty.length)]
  if (board.length > 3) {
    let bestScore = -Infinity
    let bestMove = empty[0]
    for (const [r, c] of empty) {
      const s = greedyScore(board, r, c, opponent, winLength) * 3
            + greedyScore(board, r, c, player, winLength) * 2
            + Math.random() * 0.1
      if (s > bestScore) { bestScore = s; bestMove = [r, c] }
    }
    return bestMove
  }
  const bc = board.map(r => [...r])
  let bestScore = -Infinity
  let bestMove = empty[0]
  for (const [r, c] of empty) {
    bc[r][c] = opponent
    const score = minimax(bc, 0, false, player, opponent, winLength)
    bc[r][c] = null
    if (score > bestScore) { bestScore = score; bestMove = [r, c] }
  }
  return bestMove
}

const TTTStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  .ttt-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Poppins', sans-serif;
    padding: 24px 16px;
    position: relative;
    overflow: hidden;
  }
  
  .ttt-container::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(ellipse at center, rgba(115, 199, 246, 0.12) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(217, 192, 70, 0.08) 0%, transparent 40%);
    pointer-events: none;
    z-index: 1;
  }
  
  .ttt-container::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(36, 0, 61, 0.4);
    pointer-events: none;
    z-index: 0;
  }
  
  .ttt-game-container {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 32px;
    padding: 32px 24px;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3), 
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                0 0 0 1px rgba(255, 255, 255, 0.08);
    position: relative;
    z-index: 2;
    max-width: 420px;
    width: 100%;
  }
  
  .ttt-logo {
    height: 156px;
    object-fit: contain;
    margin-bottom: 24px;
    border-radius: 12px;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  
  .ttt-heading {
    text-align: center;
    margin-bottom: 24px;
  }
  
  .ttt-heading h1 {
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
  }
  
  .ttt-heading p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }
  
  .ttt-scores {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .ttt-score-card {
    flex: 1;
    padding: 16px 12px;
    border-radius: 16px;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .ttt-score-card:hover {
    transform: translateY(-2px);
  }
  
  .ttt-score-card.x-card {
    background: #73C7F6;
    box-shadow: 0 8px 24px rgba(115, 199, 246, 0.3);
  }
  
  .ttt-score-card.o-card {
    background: #D9C046;
    box-shadow: 0 8px 24px rgba(217, 192, 70, 0.3);
  }
  
  .ttt-score-number {
    font-size: 36px;
    font-weight: 900;
    color: #1a1a1a;
    line-height: 1;
    margin-bottom: 4px;
  }
  
  .ttt-score-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(26, 26, 26, 0.7);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .ttt-status {
    text-align: center;
    margin-bottom: 24px;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .ttt-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    border-radius: 50px;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    animation: ttt-pulse 2s ease-in-out infinite;
    transition: all 0.3s ease;
  }
  
  .ttt-status-badge.turn-x {
    background: linear-gradient(135deg, #73C7F6, #5ab8e8);
    box-shadow: 0 4px 20px rgba(115, 199, 246, 0.4);
  }
  
  .ttt-status-badge.turn-o {
    background: linear-gradient(135deg, #D9C046, #c4ad3a);
    box-shadow: 0 4px 20px rgba(217, 192, 70, 0.4);
    color: #1a1a1a;
  }
  
  .ttt-status-badge.win {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.5);
    animation: ttt-glow 1.5s ease-in-out infinite;
  }
  
  .ttt-status-badge.lose {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
  }
  
  .ttt-status-badge.draw {
    background: linear-gradient(135deg, #6b7280, #4b5563);
    box-shadow: 0 4px 20px rgba(107, 114, 128, 0.4);
  }
  
  .ttt-status-badge.thinking {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
  }
  
  @keyframes ttt-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  
  @keyframes ttt-glow {
    0%, 100% { box-shadow: 0 4px 20px rgba(34, 197, 94, 0.5); }
    50% { box-shadow: 0 4px 30px rgba(34, 197, 94, 0.8); }
  }
  
  .ttt-board {
    display: grid;
    gap: 10px;
    margin: 0 auto 24px;
    width: fit-content;
  }
  
  .ttt-cell {
    width: 100px;
    height: 100px;
    background: linear-gradient(145deg, #ffffff 0%, #f0f0f5 100%);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    font-weight: 900;
    font-family: 'Poppins', sans-serif;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08);
    position: relative;
    overflow: hidden;
  }
  
  .ttt-cell::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%);
    pointer-events: none;
    border-radius: 14px 14px 0 0;
  }
  
  .ttt-cell:hover:not(:disabled) {
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1);
    filter: brightness(1.15);
  }
  
  .ttt-cell:disabled {
    cursor: default;
  }
  
  .ttt-cell.win-cell {
    animation: ttt-cell-win 0.6s ease-in-out infinite alternate;
  }
  
  .ttt-cell.win-cell.x-win {
    box-shadow: 0 0 30px rgba(115, 199, 246, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
    background: rgba(115, 199, 246, 0.2);
  }
  
  .ttt-cell.win-cell.o-win {
    box-shadow: 0 0 30px rgba(217, 192, 70, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
    background: rgba(217, 192, 70, 0.2);
  }
  
  @keyframes ttt-cell-win {
    from { transform: scale(1); }
    to { transform: scale(1.05); }
  }
  
  .ttt-x {
    color: #73C7F6;
    text-shadow: 0 0 20px rgba(115, 199, 246, 0.5);
    animation: ttt-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .ttt-o {
    color: #D9C046;
    text-shadow: 0 0 20px rgba(217, 192, 70, 0.5);
    animation: ttt-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  @keyframes ttt-pop {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .ttt-banner {
    padding: 16px 32px;
    border-radius: 16px;
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    animation: ttt-slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    margin-top: 20px;
  }
  
  .ttt-banner.win-banner {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
  }
  
  .ttt-banner.lose-banner {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
  }
  
  .ttt-banner.draw-banner {
    background: linear-gradient(135deg, #6b7280, #4b5563);
    box-shadow: 0 8px 24px rgba(107, 114, 128, 0.4);
  }
  
  .ttt-banner.turn-banner {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  }
  
  @keyframes ttt-slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .ttt-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  
  .ttt-btn {
    padding: 14px 32px;
    border-radius: 50px;
    border: none;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .ttt-btn:hover {
    transform: translateY(-2px);
  }
  
  .ttt-btn.primary {
    background: linear-gradient(135deg, #73C7F6, #5ab8e8);
    color: #1a1a1a;
    box-shadow: 0 6px 20px rgba(115, 199, 246, 0.4);
  }
  
  .ttt-btn.primary:hover {
    box-shadow: 0 8px 28px rgba(115, 199, 246, 0.6);
  }
  
  .ttt-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  
  .ttt-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .ttt-btn.start {
    background: linear-gradient(135deg, #D9C046, #c4ad3a);
    color: #1a1a1a;
    box-shadow: 0 6px 20px rgba(217, 192, 70, 0.4);
    padding: 16px 48px;
    font-size: 17px;
  }
  
  .ttt-btn.start:hover {
    box-shadow: 0 8px 28px rgba(217, 192, 70, 0.6);
  }
  
  .ttt-option-group {
    margin-bottom: 20px;
  }
  
  .ttt-option-label {
    display: block;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  
  .ttt-option-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  
  .ttt-option-card {
    height: 70px;
    border-radius: 16px;
    background: #fff;
    border: 2px solid rgba(255, 255, 255, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    font-family: 'Poppins', sans-serif;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  
  .ttt-option-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%);
    pointer-events: none;
    border-radius: 14px;
  }
  
  .ttt-option-card:hover {
    transform: translateY(-3px) scale(1.02);
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
  }
  
  .ttt-option-card.selected {
    transform: scale(1.05);
    box-shadow: 0 0 24px var(--card-glow);
    border-color: var(--card-accent);
  }
  
  .ttt-option-card.selected::after {
    content: '\\2713';
    position: absolute;
    top: 6px;
    right: 8px;
    font-size: 12px;
    font-weight: 900;
    color: #fff;
    background: var(--card-accent);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: ttt-check-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  @keyframes ttt-check-pop {
    0% { transform: scale(0); }
    100% { transform: scale(1); }
  }
  
  .ttt-option-card.board-selected {
    border-color: #73C7F6;
    background: #fff;
    --card-glow: rgba(115, 199, 246, 0.5);
    --card-accent: #73C7F6;
  }
  
  .ttt-option-card.diff-easy.selected {
    border-color: #22c55e;
    background: #fff;
    --card-glow: rgba(34, 197, 94, 0.5);
    --card-accent: #22c55e;
  }
  
  .ttt-option-card.diff-medium.selected {
    border-color: #D9C046;
    background: #fff;
    --card-glow: rgba(217, 192, 70, 0.5);
    --card-accent: #D9C046;
  }
  
  .ttt-option-card.diff-hard.selected {
    border-color: #ef4444;
    background: #fff;
    --card-glow: rgba(239, 68, 68, 0.5);
    --card-accent: #ef4444;
  }
  
  .ttt-option-value {
    font-size: 18px;
    font-weight: 800;
    color: #1a1a2e;
    line-height: 1;
    margin-bottom: 2px;
  }
  
  .ttt-option-sublabel {
    font-size: 9px;
    font-weight: 600;
    color: rgba(26, 26, 46, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .ttt-error {
    text-align: center;
    padding: 40px;
  }
  
  .ttt-error-icon {
    font-size: 56px;
    margin-bottom: 16px;
  }
  
  .ttt-error h2 {
    font-size: 24px;
    font-weight: 800;
    color: #fff;
    margin: 0 0 8px 0;
  }
  
  .ttt-error p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    margin: 0;
  }
  
  .ttt-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
    animation: ttt-fade-in 0.3s ease;
  }
  
  @keyframes ttt-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .ttt-popup-card {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 28px;
    padding: 40px 32px;
    max-width: 360px;
    width: 100%;
    text-align: center;
    box-shadow: 
      0 25px 80px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 -1px 0 rgba(255, 255, 255, 0.05),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.12);
    animation: ttt-popup-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  @keyframes ttt-popup-pop {
    0% { transform: scale(0.6); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .ttt-popup-emoji {
    font-size: 72px;
    margin-bottom: 16px;
    animation: ttt-bounce 1s ease-in-out infinite;
  }
  
  @keyframes ttt-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  
  .ttt-popup-title {
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
    text-shadow: 0 4px 20px rgba(255, 255, 255, 0.2);
  }
  
  .ttt-popup-win .ttt-popup-title {
    background: linear-gradient(135deg, #22c55e, #4ade80);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .ttt-popup-lose .ttt-popup-title {
    color: #ef4444;
  }
  
  .ttt-popup-sub {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
  }
  
  .ttt-popup-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 28px;
  }
  
  @media (max-width: 480px) {
    .ttt-container {
      padding: 16px 12px;
    }
    
    .ttt-game-container {
      padding: 24px 16px;
      border-radius: 24px;
    }
    
    .ttt-logo {
      height: 120px;
      margin-bottom: 16px;
    }
    
    .ttt-heading h1 {
      font-size: 20px;
    }
    
    .ttt-heading p {
      font-size: 12px;
    }
    
    .ttt-scores {
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .ttt-score-card {
      padding: 12px 10px;
    }
    
    .ttt-score-number {
      font-size: 28px;
    }
    
    .ttt-score-label {
      font-size: 10px;
    }
    
    .ttt-status {
      margin-bottom: 16px;
    }
    
    .ttt-status-badge {
      padding: 10px 20px;
      font-size: 13px;
    }
    
    .ttt-cell {
      width: 70px;
      height: 70px;
      font-size: 32px;
      border-radius: 12px;
    }
    
    .ttt-board {
      gap: 8px;
      margin: 0 auto 16px;
    }
    
    .ttt-btn {
      padding: 12px 24px;
      font-size: 13px;
    }
    
    .ttt-btn.start {
      padding: 13px 32px;
      font-size: 14px;
    }
    
    .ttt-option-group {
      margin-bottom: 16px;
    }
    
    .ttt-option-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    
    .ttt-option-card {
      height: 60px;
      border-radius: 12px;
    }
    
    .ttt-option-value {
      font-size: 15px;
    }
    
    .ttt-option-sublabel {
      font-size: 8px;
    }
    
    .ttt-popup-card {
      padding: 28px 20px;
      margin: 12px;
    }
    
    .ttt-popup-emoji {
      font-size: 52px;
      margin-bottom: 12px;
    }
    
    .ttt-popup-title {
      font-size: 22px;
    }
    
    .ttt-popup-sub {
      font-size: 12px;
    }
    
    .ttt-popup-actions {
      margin-top: 20px;
    }
  }
  
  @media (max-width: 360px) {
    .ttt-game-container {
      padding: 20px 14px;
      border-radius: 20px;
    }
    
    .ttt-logo {
      height: 105px;
      margin-bottom: 14px;
    }
    
    .ttt-heading h1 {
      font-size: 18px;
    }
    
    .ttt-cell {
      width: 60px;
      height: 60px;
      font-size: 28px;
    }
    
    .ttt-board {
      gap: 6px;
      margin: 0 auto 14px;
    }
    
    .ttt-option-grid {
      gap: 6px;
    }
    
    .ttt-option-card {
      height: 54px;
    }
  }
`

export default function TicTacToePlayerPage({ gameData, sessionToken: initToken, sessionId: initSessionId, onSessionStart, onComplete }) {
  const settings = gameData?.settings || {}
  console.log('[GAME] board_selection:', settings.enable_board_selection, 'level_selection:', settings.enable_level_selection)
  const defBoardSize = parseInt(settings.board_size) || 3
  const defDifficulty = settings.difficulty || 'easy'
  const soundMap = gameData?.soundMap || {}

  const [chosenBoardSize, setChosenBoardSize] = useState(defBoardSize)
  const [chosenDifficulty, setChosenDifficulty] = useState(defDifficulty)
  const [gameStarted, setGameStarted] = useState(false)
  const [board, setBoard] = useState(() =>
    Array.from({ length: defBoardSize }, () => Array(defBoardSize).fill(null))
  )
  const [currentTurn, setCurrentTurn] = useState('player')
  const [gameOver, setGameOver] = useState(null)
  const [winCells, setWinCells] = useState([])
  const [sessionToken, setSessionToken] = useState(initToken)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [boardVer, setBoardVer] = useState(0)
  const [scores, setScores] = useState({ x: 0, o: 0 })
  const [termsAgreed, setTermsAgreed] = useState(false)
  const gameResultRef = useRef({ score: 0, result: null })

  const resolveSound = (id) => {
    if (!id) return null
    const n = parseInt(id)
    return !isNaN(n) ? (soundMap[n] || null) : id
  }

  const boardSize = gameStarted ? chosenBoardSize : defBoardSize
  const difficulty = gameStarted ? chosenDifficulty : defDifficulty
  const winLength = boardSize

  const completeSession = async (score) => {
    try {
      const res = await api.post('/play/session/complete', {
        session_token: sessionToken, score,
        player_data: { game_result: gameResultRef.current.result, board_size: boardSize, difficulty },
      })
      if (onComplete) onComplete({ ...res.data, redirect_url: gameData.redirect_url })
    } catch {
      if (onComplete) onComplete({ redirect_url: gameData.redirect_url })
    }
  }

  const endGame = (result, cells, score) => {
    setGameOver(result)
    setWinCells(cells || [])
    gameResultRef.current = { score, result }
    if (result === 'win') {
      setScores(s => ({ ...s, x: s.x + 1 }))
      playSound(resolveSound(settings.win_sound_id))
    } else if (result === 'lose') {
      setScores(s => ({ ...s, o: s.o + 1 }))
      playSound(resolveSound(settings.lose_sound_id))
    }
  }

  const handleCellClick = async (row, col) => {
    if (currentTurn !== 'player' || gameOver || board[row][col]) return

    let token = sessionToken
    if (!token) {
      try {
        const playerUser = JSON.parse(localStorage.getItem('playerUser') || '{}')
        const src = new URLSearchParams(window.location.search).get('source') === 'direct' ? 'direct' : 'link'
        const res = await api.post('/play/session/start', {
          game_id: gameData.id, player_data: {},
          source_type: src, promo_player_id: playerUser.id || null,
        })
        if (!res.data.success) {
          if (res.data.already_played || (res.data.message && res.data.message.toLowerCase().includes('already played'))) { setAlreadyPlayed(true); return }
          throw new Error(res.data.message)
        }
        token = res.data.session_token
        setSessionToken(token)
        if (onSessionStart) onSessionStart(token, res.data.session_id)
      } catch (err) {
        setErrorMsg(err.message || 'Could not start game')
        return
      }
    }

    const b = board.map(r => [...r])
    b[row][col] = 'X'
    setBoard(b)
    setBoardVer(v => v + 1)
    playSound(resolveSound(settings.sound_correct_id))

    const playerResult = checkWinner(b, winLength)
    if (playerResult) { setCurrentTurn('ai'); setTimeout(() => endGame('win', playerResult.cells, 1), 600); return }
    if (isBoardFull(b)) { setCurrentTurn('ai'); setTimeout(() => endGame('draw', [], 0), 600); return }

    setCurrentTurn('ai')
    const aiBoard = b
    setTimeout(() => {
      const latest = aiBoard.map(r => [...r])
      const move = getAiMove(latest, difficulty, 'X', 'O', winLength)
      if (!move) { setCurrentTurn('player'); return }
      latest[move[0]][move[1]] = 'O'
      setBoard(latest)
      setBoardVer(v => v + 1)
      playSound(resolveSound(settings.sound_wrong_id))

      const aiResult = checkWinner(latest, winLength)
      if (aiResult) {
        setCurrentTurn('ai')
        setTimeout(() => endGame('lose', aiResult.cells, 0), 600)
        return
      }
      if (isBoardFull(latest)) {
        setTimeout(() => endGame('draw', [], 0), 600)
        return
      }
      setCurrentTurn('player')
    }, 600)
  }

  const handleStart = () => {
    setBoard(Array.from({ length: chosenBoardSize }, () => Array(chosenBoardSize).fill(null)))
    setGameStarted(true)
    setGameOver(null)
    setWinCells([])
    setCurrentTurn('player')
    setBoardVer(v => v + 1)
    setScores({ x: 0, o: 0 })
    gameResultRef.current = { score: 0, result: null }
  }
  
  const handleContinue = () => completeSession(gameResultRef.current.score)
  
  const handleRetry = () => {
    const nb = Array.from({ length: chosenBoardSize }, () => Array(chosenBoardSize).fill(null))
    setBoard(nb)
    setGameOver(null)
    setWinCells([])
    setCurrentTurn('player')
    setBoardVer(v => v + 1)
    gameResultRef.current = { score: 0, result: null }
  }

  const boardCellColor = settings?.board_cell_color || '#ffffff'
  const heading1Color = settings?.heading_1_color || '#ffffff'
  const heading2Color = settings?.heading_2_color || 'rgba(255,255,255,0.6)'
  const fontFamily = settings?.font_family ? `'${settings.font_family}', sans-serif` : "'Poppins', sans-serif"

  const containerBgStyle = settings?.bg_image_url
    ? { backgroundImage: `url(${settings.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { background: settings?.bg_color || '#24003D' }

  const dynamicColorCSS = `.ttt-cell { background: linear-gradient(145deg, ${boardCellColor} 0%, ${boardCellColor}dd 100%) !important; border: 1px solid rgba(0, 0, 0, 0.06) !important; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08) !important; } .ttt-cell:hover:not(:disabled) { background: linear-gradient(145deg, ${boardCellColor} 0%, ${boardCellColor}ee 100%) !important; filter: brightness(1.05); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1) !important; }`

  if (alreadyPlayed) return (
    <>
      <style>{TTTStyles}</style>
      <style>{dynamicColorCSS}</style>
      <div className="ttt-container" style={containerBgStyle}>
        <div className="ttt-game-container">
          <div className="ttt-error">
            <div className="ttt-error-icon">{'\u274C'}</div>
            <h2>Already Played!</h2>
            <p>You've already completed this game.</p>
          </div>
        </div>
      </div>
    </>
  )
  
  if (errorMsg) return (
    <>
      <style>{TTTStyles}</style>
      <style>{dynamicColorCSS}</style>
      <div className="ttt-container" style={containerBgStyle}>
        <div className="ttt-game-container">
          <div className="ttt-error">
            <div className="ttt-error-icon">{'\u274C'}</div>
            <h2>Error</h2>
            <p>{errorMsg}</p>
          </div>
        </div>
      </div>
    </>
  )

  const isWinCell = (r, c) => winCells.some(([wr, wc]) => wr === r && wc === c)
  const maxBoardWidth = Math.min(380, window.innerWidth - 64)
  const cellSize = Math.floor((maxBoardWidth - (chosenBoardSize - 1) * 10) / chosenBoardSize)

  const getStatusContent = () => {
    if (gameOver === 'win') return { text: settings.custom_win_msg || 'You Win!', className: 'win' }
    if (gameOver === 'lose') return { text: "Player O Wins!", className: 'lose' }
    if (gameOver === 'draw') return { text: 'Draw Game', className: 'draw' }
    if (currentTurn === 'ai') {
      const winCheck = checkWinner(board, winLength)
      if (winCheck && winCheck.winner === 'O') return { text: "Player O Wins!", className: 'lose' }
      if (winCheck && winCheck.winner === 'X') return { text: settings.custom_win_msg || 'You Win!', className: 'win' }
      return { text: 'Thinking...', className: 'thinking' }
    }
    return { text: 'Your Turn (X)', className: 'turn-x' }
  }

  const status = getStatusContent()

  return (
    <>
      <style>{TTTStyles}</style>
      <style>{dynamicColorCSS}</style>
      <div className="ttt-container" style={{ ...containerBgStyle, fontFamily }}>
        <div className="ttt-game-container">
          {settings.game_logo_url && (
            <img src={settings.game_logo_url} alt="Game logo" className="ttt-logo" />
          )}
          
          {(settings.heading_1 || settings.heading_2 || settings.heading_3 || settings.description_text) && (
            <div className="ttt-heading">
              {settings.heading_1 && <h1 style={{ color: heading1Color }}>{settings.heading_1}</h1>}
              {settings.heading_2 && <p style={{ color: heading2Color }}>{settings.heading_2}</p>}
              {settings.heading_3 && <p style={{ color: settings.heading_3_color || 'rgba(255,255,255,0.4)', fontSize: 13, margin: '2px 0 0' }}>{settings.heading_3}</p>}
              {settings.description_text && <p style={{ color: settings.description_color || 'rgba(255,255,255,0.45)', fontSize: 14, margin: '8px 0 0', lineHeight: 1.5 }}>{settings.description_text}</p>}
            </div>
          )}

          {!gameStarted ? (
            <div style={{ padding: '20px 0' }}>
              {(settings.enable_board_selection == 1 || settings.enable_board_selection === true || settings.enable_board_selection === undefined) && (
                <div className="ttt-option-group">
                  <label className="ttt-option-label">Board Size</label>
                  <div className="ttt-option-grid">
                    {[3, 4, 5].map(size => (
                      <div
                        key={size}
                        className={`ttt-option-card ${chosenBoardSize === size ? 'board-selected selected' : ''}`}
                        onClick={() => setChosenBoardSize(size)}
                      >
                        <span className="ttt-option-value">{size}×{size}</span>
                        <span className="ttt-option-sublabel">grid</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(settings.enable_level_selection == 1 || settings.enable_level_selection === true || settings.enable_level_selection === undefined) && (
                <div className="ttt-option-group">
                  <label className="ttt-option-label">Difficulty</label>
                  <div className="ttt-option-grid">
                    {[
                      { value: 'easy', label: 'Easy', color: 'diff-easy' },
                      { value: 'medium', label: 'Medium', color: 'diff-medium' },
                      { value: 'hard', label: 'Hard', color: 'diff-hard' },
                    ].map(diff => (
                      <div
                        key={diff.value}
                        className={`ttt-option-card ${diff.color} ${chosenDifficulty === diff.value ? 'selected' : ''}`}
                        onClick={() => setChosenDifficulty(diff.value)}
                      >
                        <span className="ttt-option-value">{diff.label}</span>
                        <span className="ttt-option-sublabel">mode</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                {settings.terms_enabled && (
                  <div style={{ marginBottom: 16, textAlign: 'left', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} style={{ width: 14, height: 14 }} />
                      {settings.terms_url ? <a href={settings.terms_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{settings.terms_text || 'Terms & Conditions'}</a> : <span>{settings.terms_text || 'Terms & Conditions'}</span>}
                    </label>
                  </div>
                )}
                <button onClick={handleStart} className="ttt-btn start"
                  disabled={!!settings.terms_enabled && !termsAgreed}
                  style={{
                    color: settings.start_button_text_color || '#1a1a1a',
                    background: settings.start_button_bg_color || 'linear-gradient(135deg, #D9C046, #c4ad3a)',
                    boxShadow: settings.start_button_bg_color ? `0 6px 20px ${settings.start_button_bg_color}66` : '0 6px 20px rgba(217, 192, 70, 0.4)',
                    opacity: (!!settings.terms_enabled && !termsAgreed) ? 0.5 : 1,
                    cursor: (!!settings.terms_enabled && !termsAgreed) ? 'not-allowed' : 'pointer'
                  }}>
                  {settings.start_button_text || 'Start Game'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="ttt-status">
                <div className={`ttt-status-badge ${status.className}`}>
                  {status.text}
                </div>
              </div>

              <div key={boardVer} className="ttt-board" style={{ gridTemplateColumns: `repeat(${chosenBoardSize}, ${cellSize}px)` }}>
                {board.map((row, r) =>
                  row.map((cell, c) => (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      disabled={!!gameOver || currentTurn !== 'player' || !!cell}
                      className={`ttt-cell ${isWinCell(r, c) ? 'win-cell' : ''} ${isWinCell(r, c) && gameOver === 'win' ? 'x-win' : ''} ${isWinCell(r, c) && gameOver === 'lose' ? 'o-win' : ''}`}
                      style={{ width: cellSize, height: cellSize, fontSize: Math.max(20, cellSize * 0.4) }}
                    >
                      {cell && (
                        <span className={cell === 'X' ? 'ttt-x' : 'ttt-o'}>
                          {cell === 'O' && settings.o_image_url
                            ? <img src={settings.o_image_url} alt="O" style={{ width: '65%', height: '65%', objectFit: 'contain' }} />
                            : cell}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {gameOver && (
        <div className="ttt-popup-overlay">
          <div className="ttt-popup-card">
            {gameOver === 'win' ? (
              <div className="ttt-popup-win">
                <div className="ttt-popup-emoji">{'\uD83C\uDF89'}</div>
                <div className="ttt-popup-title">{settings.custom_win_msg || 'YOU WIN!'}</div>
              </div>
            ) : (
              <div className="ttt-popup-lose">
                <div className="ttt-popup-emoji">{'\uD83D\uDE14'}</div>
                <div className="ttt-popup-title">Better Luck Next Time!</div>
                <div className="ttt-popup-sub">
                  {gameOver === 'draw' 
                    ? 'The game ended in a draw.' 
                    : 'Player O outsmarted you this round.'}
                </div>
              </div>
            )}
            <div className="ttt-popup-actions">
              {gameOver !== 'draw' && (
                <button onClick={handleRetry} className="ttt-btn secondary"
                  style={{
                    color: settings.try_again_text_color || '#ffffff',
                    background: settings.try_again_bg_color || 'rgba(255, 255, 255, 0.1)',
                    border: settings.try_again_bg_color ? 'none' : '1px solid rgba(255, 255, 255, 0.15)'
                  }}>
                  {settings.try_again_btn_text || 'Try Again'}
                </button>
              )}
              {(gameOver === 'win' || gameOver === 'lose') && (
                <button onClick={handleContinue} className="ttt-btn primary"
                  style={{
                    color: settings.continue_btn_text_color || '#1a1a1a',
                    background: settings.continue_btn_bg_color || 'linear-gradient(135deg, #73C7F6, #5ab8e8)',
                    boxShadow: settings.continue_btn_bg_color ? `0 6px 20px ${settings.continue_btn_bg_color}66` : '0 6px 20px rgba(115, 199, 246, 0.4)'
                  }}>
                  {settings.continue_btn_text || 'Continue'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}