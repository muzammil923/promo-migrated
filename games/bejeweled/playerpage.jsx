import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const DEFAULT_TILE_COLORS = {
  '2': '#ff6b6b',
  '4': '#4ecdc4',
  '8': '#45b7d1',
  '16': '#f9ca24',
  '32': '#f0932b',
  '64': '#eb4d4b',
  '128': '#574b90',
  '256': '#2c3e50',
  '512': '#34495e',
  '1024': '#2c3e50',
  '2048': '#1a1a2e',
  '4096': '#0f3d3f'
}

export default function BejeweledPlayerPage({ gameData, sessionToken, onComplete, config }) {
  const params = useParams()
  const navigate = useNavigate()
  const id = gameData?.id || params.id

  const settings = gameData?.settings || config?.settings || {}

  const [gameConfig, setGameConfig] = useState(null)
  const [gameBoard, setGameBoard] = useState([])
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [selectedTile, setSelectedTile] = useState(null)
  const [matchEffect, setMatchEffect] = useState(null)

  const gameContainerRef = useRef(null)

  // Parse settings from gameData (player-facing) — same DB row the admin builder writes
  useEffect(() => {
    const gridSize = parseInt(settings.grid_size) || 8
    const tileColors = parseTileColors(settings.theme_colors)
    setGameConfig({ gridSize, tileColors, matchScore: parseInt(settings.match_score) || 10, chainMultiplier: parseFloat(settings.chain_score_multiplier) || 2 })
    setGameBoard(buildBoard(gridSize, tileColors))
    setScore(0)
    setMoves(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buildBoard = (size, tileColors) => {
    const board = []
    for (let row = 0; row < size; row++) {
      const rowData = []
      for (let col = 0; col < size; col++) {
        const tileValue = getRandomTileValue()
        rowData.push({ value: tileValue, color: tileColors[tileValue] || tileColors[2], matched: false, animating: false })
      }
      board.push(rowData)
    }
    return board
  }

  // Parse tile colors from JSON string
  const parseTileColors = (colorsStr) => {
    if (!colorsStr) return { ...DEFAULT_TILE_COLORS }
    if (typeof colorsStr === 'string') {
      try {
        return { ...DEFAULT_TILE_COLORS, ...JSON.parse(colorsStr) }
      } catch {
        return { ...DEFAULT_TILE_COLORS }
      }
    }
    if (typeof colorsStr === 'object') return { ...DEFAULT_TILE_COLORS, ...colorsStr }
    return { ...DEFAULT_TILE_COLORS }
  }

  // Get random tile value (powers of 2)
  const getRandomTileValue = () => {
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]
    return values[Math.floor(Math.random() * values.length)]
  }

  // Report score via the standard game completion flow
  const finishGame = (finalScore) => {
    if (finished) return
    setFinished(true)
    if (onComplete) {
      onComplete({ score: finalScore || score, moves })
    }
  }

  // Handle tile click
  const handleTileClick = (row, col) => {
    if (finished) return

    const tile = gameBoard[row][col]

    // If no tile selected, select this one
    if (!selectedTile) {
      setSelectedTile({ row, col, value: tile.value })
      return
    }

    // If same tile clicked, deselect
    if (selectedTile.row === row && selectedTile.col === col) {
      setSelectedTile(null)
      return
    }

    // Check if tiles are adjacent
    const isAdjacent = (
      Math.abs(selectedTile.row - row) === 1 && selectedTile.col === col ||
      Math.abs(selectedTile.col - col) === 1 && selectedTile.row === row
    )

    if (!isAdjacent) {
      setSelectedTile(null)
      return
    }

    // Swap tiles
    swapTiles(selectedTile.row, selectedTile.col, row, col)
    setSelectedTile(null)
  }

  // Swap two tiles
  const swapTiles = async (row1, col1, row2, col2) => {
    const newBoard = [...gameBoard]

    // Swap in the board
    const temp = newBoard[row1][col1]
    newBoard[row1][col1] = newBoard[row2][col2]
    newBoard[row2][col2] = temp

    setGameBoard(newBoard)

    // Check for matches
    await detectMatches(newBoard)

    // Update move count
    setMoves(prev => prev + 1)
  }

  // Detect matches and handle chain reactions
  const detectMatches = async (board) => {
    const size = board.length
    const toRemove = new Set()
    let matchCount = 0

    // Check horizontal matches
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size - 2; col++) {
        if (board[row][col].value === board[row][col + 1].value &&
            board[row][col].value === board[row][col + 2].value) {
          toRemove.add(`${row},${col}`)
          toRemove.add(`${row},${col + 1}`)
          toRemove.add(`${row},${col + 2}`)
          matchCount += 3
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < size; col++) {
      for (let row = 0; row < size - 2; row++) {
        if (board[row][col].value === board[row + 1][col].value &&
            board[row][col].value === board[row + 2][col].value) {
          toRemove.add(`${row},${col}`)
          toRemove.add(`${row + 1},${col}`)
          toRemove.add(`${row + 2},${col}`)
          matchCount += 3
        }
      }
    }

    if (toRemove.size > 0) {
      // Mark tiles for removal and apply gravity
      const removeSet = toRemove
      for (let col = 0; col < size; col++) {
        let emptySpaces = 0
        for (let row = size - 1; row >= 0; row--) {
          if (removeSet.has(`${row},${col}`)) {
            emptySpaces++
            board[row][col] = { value: 0, color: '#ddd', matched: true, animating: false }
          } else if (emptySpaces > 0) {
            board[row + emptySpaces][col] = board[row][col]
            board[row][col] = { value: 0, color: '#ddd', matched: false, animating: false }
          }
        }
        // Fill top with new tiles
        for (let row = 0; row < emptySpaces; row++) {
          const v = getRandomTileValue()
          board[row][col] = {
            value: v,
            color: gameConfig.tileColors[v] || gameConfig.tileColors[2],
            matched: false,
            animating: true
          }
        }
      }

      setGameBoard(board)

      // Calculate score
      const gc = gameConfig
      const baseScore = matchCount * gc.matchScore
      const chainMultiplier = matchEffect ? gc.chainMultiplier : 1
      const finalScore = baseScore * chainMultiplier
      setScore(prev => prev + finalScore)

      // Trigger chain reaction if more matches exist
      if (matchEffect) {
        setTimeout(() => detectMatches(board), 300)
      } else {
        setMatchEffect(true)
        setTimeout(() => setMatchEffect(false), 300)
      }
      return
    }

    // No matches remain — check for game over (no possible adjacent same-value swaps)
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const v = board[row][col].value
        if (v === 0) continue
        if (col + 1 < size && board[row][col + 1].value === v) return
        if (row + 1 < size && board[row + 1][col].value === v) return
      }
    }
    finishGame()
  }

  // Get tile value display
  const getTileValue = (value) => {
    if (value >= 1000) {
      return Math.floor(value / 1000) + 'k'
    }
    return value
  }

  if (!gameConfig) {
    return (
      <div className="gb-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <style>{LIGHT}</style>
        <div style={{ textAlign: 'center', color: 'var(--gb-text2)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e6f0', borderTopColor: '#6366f1', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
          Loading Bejeweled Game...
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    )
  }

  const gridSize = gameConfig.gridSize
  const bgStyle = settings.bg_image_url
    ? `url(${settings.bg_image_url}) center/cover`
    : (settings.bg_color || '#f4f6fb')

  return (
    <div className="gb-wrap" style={{ minHeight: '100vh', background: bgStyle, padding: '20px' }}>
      <style>{LIGHT}</style>

      {/* Game Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: settings.heading_1_color || 'var(--gb-text)' }}>
            {settings.heading_1 || 'Logo Bejeweled'}
          </h1>
          <div style={{ fontSize: 14, color: 'var(--gb-text2)' }}>
            Match logo segments • Score: {score} • Moves: {moves}
          </div>
        </div>
        {settings.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxHeight: 48, objectFit: 'contain', borderRadius: 8 }} />}
      </div>

      {/* Game Board */}
      <div
        ref={gameContainerRef}
        className="gb-phone"
        style={{ margin: '0 auto', position: 'relative', maxWidth: Math.min(gridSize * 42 + 24, 520) }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: '4px',
          padding: '10px',
          background: 'rgba(0,0,0,0.08)',
          borderRadius: '20px',
          aspectRatio: '1 / 1'
        }}>
          {gameBoard.map((row, rowIndex) => (
            row.map((tile, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: tile.color,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: tile.value >= 1000 ? '0.7em' : '1em',
                  fontWeight: 'bold',
                  color: tile.value <= 4 ? '#776e65' : '#f9f6f2',
                  border: tile.matched ? '2px solid #ff4444' : '1px solid rgba(0,0,0,0.1)',
                  cursor: finished ? 'default' : 'pointer',
                  transform: tile.animating ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  animation: tile.matched ? 'matchFlash 0.3s ease' : 'none',
                  boxSizing: 'border-box'
                }}
                onClick={() => handleTileClick(rowIndex, colIndex)}
              >
                {tile.value > 0 ? getTileValue(tile.value) : ''}
              </div>
            ))
          ))}
        </div>
      </div>

      {/* Game Over Overlay */}
      {finished && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '300px'
          }}>
            <h2 style={{ fontSize: 24, marginBottom: 10 }}>Game Over!</h2>
            <div style={{ fontSize: 16, marginBottom: 20 }}>
              <div>Score: {score}</div>
              <div>Moves: {moves}</div>
            </div>
            <button
              className="gb-btn gb-btn-ghost"
              onClick={() => window.top.location.href = '/arcade'}
            >
              Back to Games
            </button>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes matchFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

const LIGHT = `
.gb-wrap {
  --gb-bg:        #f4f6fb;
  --gb-surface:   #ffffff;
  --gb-surface2:  #f0f2f8;
  --gb-border:    #e2e6f0;
  --gb-border2:   #cdd3e0;
  --gb-primary:   #6366f1;
  --gb-primary-d: #4f46e5;
  --gb-primary-g: rgba(99,102,241,0.15);
  --gb-success:   #16a34a;
  --gb-danger:    #dc2626;
  --gb-text:      #1e1e2e;
  --gb-text2:     #64657a;
  --gb-text3:     #9899ae;
  --gb-shadow:    0 2px 12px rgba(0,0,0,0.08);
  --gb-shadow-md: 0 4px 24px rgba(0,0,0,0.10);
  --gb-radius:    12px;
  --gb-radius-sm: 8px;
  font-family: 'DM Sans', sans-serif;
  background: var(--gb-bg);
  color: var(--gb-text);
  min-height: 100vh;
}
.gb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; font-size: 13px; font-weight: 600;
  border-radius: 8px; border: none; cursor: pointer;
  transition: all .15s; white-space: nowrap; font-family: inherit;
}
.gb-btn-ghost { background: #fff; color: #64657a; border: 1.5px solid #e2e6f0; }
.gb-btn-ghost:hover { border-color: #6366f1; color: #6366f1; }
`;
