import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const SpacePlayerPage = () => {
  const { gameName, companyName } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [settings, setSettings] = useState({});
  const [soundMap, setSoundMap] = useState({});
  const [ships, setShips] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [gameState, setGameState] = useState('loading'); // loading, playing, paused, complete
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const keysRef = useRef({});
  const lastTimeRef = useRef(0);
  const playerRef = useRef(null);
  const bulletsRef = useRef([]);
  const enemiesRef = useRef([]);
  const particlesRef = useRef([]);
  
  const PLAYER_SIZE = 40;
  const BULLET_SIZE = 4;
  const ENEMY_SIZE = { small: 30, medium: 40, large: 50 };
  const GRAVITY = 0;
  const PLAYER_SPEED = Number(settings?.player_speed) || 5;
  const BULLET_SPEED = Number(settings?.laser_speed) || 10;
  const ENEMY_SPEED = (() => {
    const base = Number(settings?.enemy_speed) || 2;
    return { straight: base, zigzag: base + 1, circle: Math.max(1, base - 1), sine: base, random: base };
  })();

  const playSoundById = (id) => {
    if (!id) return;
    const url = soundMap[id] || (typeof id === 'string' && id.startsWith('http') ? id : null);
    if (!url) return;
    try { const a = new Audio(url); a.play().catch(() => {}); } catch {}
  };
  
  // Load game data
  useEffect(() => {
    api.get(`space/${gameName}/${companyName}`)
      .then(res => {
        if (!res.data?.success || !res.data.game) {
          console.error('Error loading game:', res.data?.message || 'Game not found');
          return;
        }
        setGame(res.data.game);
        setSettings(res.data.settings || {});
        setSoundMap(res.data.game.soundMap || {});
        setShips(res.data.ships || []);
        setWeapons(res.data.weapons || []);
        setEnemies(res.data.enemies || []);
        setLevels(res.data.levels || []);
        setBestScore(res.data.game.high_score || 0);
        // Set default ship as selected
        const defaultShip = (res.data.ships || []).find(s => s.is_default);
        if (defaultShip) setSelectedShip(defaultShip);
      })
      .catch(err => {
        console.error('Error loading game:', err);
      });
  }, [gameName, companyName, navigate]);
  
  // Load progress for current level
  useEffect(() => {
    if (currentLevelIndex >= 0 && levels.length > 0) {
      const level = levels[currentLevelIndex];
      setCurrentLevel(level);
      
      api.get(`play/session/progress`, {
        params: {
          game_id: game?.id,
          level_id: level.id,
          session_token: localStorage.getItem('playerToken')
        }
      })
      .then(res => {
        const progress = res.data.progress;
        if (progress) {
          setScore(progress.score || 0);
          setKills(progress.kills || 0);
          setTimeElapsed(progress.time_elapsed || 0);
          setDeaths(progress.deaths || 0);
          setBestTime(progress.best_time || null);
        }
      })
      .catch(err => {
        console.log('No existing progress, starting fresh');
      });
    }
  }, [currentLevelIndex, levels, game?.id]);
  
  // Game loop
  useEffect(() => {
    if (gameState !== 'playing' || !currentLevel) return;
    
    const gameLoop = (timestamp) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;
      
      updateGame(deltaTime);
      renderGame();
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, currentLevel]);
  
  // Timer
  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      e.preventDefault();
    };
    
    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
      e.preventDefault();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Touch controls for mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Fire button (right side of screen)
      if (x > rect.width / 2) {
        keysRef.current[' '] = true;
      }
      
      // Move left button (left side of screen)
      if (x < rect.width / 2 && x > rect.width / 4) {
        keysRef.current['arrowleft'] = true;
      }
      
      // Move right button (right side of screen)
      if (x > rect.width / 2 && x < rect.width * 0.75) {
        keysRef.current['arrowright'] = true;
      }
    };
    
    const handleTouchEnd = (e) => {
      e.preventDefault();
      keysRef.current[' '] = false;
      keysRef.current['arrowleft'] = false;
      keysRef.current['arrowright'] = false;
    };
    
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  
  const updateGame = (deltaTime) => {
    if (!game || gameState !== 'playing') return;
    
    // Update player
    if (playerRef.current) {
      const player = playerRef.current;
      
      if (keysRef.current['arrowleft'] || keysRef.current['a']) {
        player.x -= PLAYER_SPEED * deltaTime;
      }
      if (keysRef.current['arrowright'] || keysRef.current['d']) {
        player.x += PLAYER_SPEED * deltaTime;
      }
      if ((keysRef.current['arrowup'] || keysRef.current['w'] || keysRef.current[' ']) && !player.isDead) {
        player.shooting = true;
      } else {
        player.shooting = false;
      }
      
      // Keep player in bounds
      const canvasW = canvasRef.current ? canvasRef.current.width : (currentLevel?.width || 800);
      player.x = Math.max(PLAYER_SIZE / 2, Math.min(canvasW - PLAYER_SIZE / 2, player.x));
      
      // Update bullets
      bulletsRef.current = bulletsRef.current.filter(bullet => {
        bullet.y -= BULLET_SPEED * deltaTime;
        return bullet.y > 0;
      });
      
      // Spawn enemies
      if (Math.random() < 0.02 * deltaTime) {
        spawnEnemy();
      }
      
      // Update enemies
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        enemy.x += enemy.speed * deltaTime;
        
        // Check for collision with player
        if (checkCollision(enemy, player)) {
          die();
          return false;
        }
        
        // Check for collision with bullets
        for (let i = 0; i < bulletsRef.current.length; i++) {
          const bullet = bulletsRef.current[i];
          if (checkCollision(enemy, bullet)) {
            // Enemy hit
            enemiesRef.current.splice(i, 1);
            bulletsRef.current.splice(i, 1);
            setKills(prev => prev + 1);
            setScore(prev => prev + enemy.points_value);
            spawnExplosion(enemy.x, enemy.y);
            return false;
          }
        }
        
        return true;
      });
      
      // Check win condition
      if (currentLevel.target_score > 0 && score >= currentLevel.target_score) {
        completeLevel();
      }
      
      // Update progress
      saveProgress();
    }
  };
  
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    if (settings.bg_image_url) {
      const img = new Image();
      img.src = settings.bg_image_url;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = settings.bg_color || '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < settings.star_density || 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw particles
    particlesRef.current.forEach((particle, index) => {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Remove old particles
    particlesRef.current = particlesRef.current.filter(particle => particle.life > 0);
    particlesRef.current.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 1;
      particle.size *= 0.95;
    });
    
    // Draw enemies
    enemiesRef.current.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      
      ctx.fillStyle = enemy.color;
      ctx.fillRect(-ENEMY_SIZE.medium / 2, -ENEMY_SIZE.medium / 2, ENEMY_SIZE.medium, ENEMY_SIZE.medium);
      
      ctx.restore();
    });
    
    // Draw bullets
    bulletsRef.current.forEach(bullet => {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bullet.x - BULLET_SIZE / 2, bullet.y, BULLET_SIZE, BULLET_SIZE * 2);
    });
    
    // Draw player
    ctx.save();
    ctx.translate(playerRef.current.x, playerRef.current.y);
    
    if (selectedShip?.image_url) {
      const img = new Image();
      img.src = selectedShip.image_url;
      ctx.drawImage(img, -PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
    } else {
      ctx.fillStyle = selectedShip?.color || settings.primary_color || '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(0, -PLAYER_SIZE / 2);
      ctx.lineTo(PLAYER_SIZE / 2, PLAYER_SIZE / 2);
      ctx.lineTo(-PLAYER_SIZE / 2, PLAYER_SIZE / 2);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
    
    // Draw UI
    drawUI(ctx);
  };
  
  const drawUI = (ctx) => {
    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);
    
    // Kills
    ctx.fillText(`Kills: ${kills}`, 20, 70);
    
    // Time
    if (settings.show_timer) {
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = timeElapsed % 60;
      ctx.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 100);
    }
    
    // Deaths
    ctx.fillText(`Deaths: ${deaths}`, 20, 130);
    
    // Level info
    ctx.fillText(`Level ${currentLevelIndex + 1} of ${levels.length}`, canvas.width - 20, 40, canvas.width - 40);
    
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 40);
      
      ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Kills: ${kills}`, canvas.width / 2, canvas.height / 2 + 30);
      
      ctx.font = '16px sans-serif';
      ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 80);
    }
    
    // Level complete overlay
    if (gameState === 'complete') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Level Complete!', canvas.width / 2, canvas.height / 2 - 40);
      
      ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Kills: ${kills}`, canvas.width / 2, canvas.height / 2 + 30);
      
      if (currentLevelIndex < levels.length - 1) {
        ctx.font = '16px sans-serif';
        ctx.fillText('Press SPACE to continue', canvas.width / 2, canvas.height / 2 + 80);
      } else {
        ctx.font = '16px sans-serif';
        ctx.fillText('All levels completed!', canvas.width / 2, canvas.height / 2 + 80);
      }
    }
  };
  
  const spawnEnemy = () => {
    const enemyTypes = ['small', 'medium', 'large'];
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const randomEnemy = enemies.find(e => e.type === randomType);
    
    if (!randomEnemy) return;
    
    const enemy = {
      id: Date.now(),
      type: randomType,
      x: Math.random() * (currentLevel.width - ENEMY_SIZE[randomType]),
      y: 0,
      width: ENEMY_SIZE[randomType],
      height: ENEMY_SIZE[randomType],
      color: randomEnemy.color,
      speed: ENEMY_SPEED[randomEnemy.move_pattern] || ENEMY_SPEED.straight,
      hp: randomEnemy.hp,
      points_value: randomEnemy.points_value,
      attack_damage: randomEnemy.attack_damage,
      move_pattern: randomEnemy.move_pattern,
      shoot_pattern: randomEnemy.shoot_pattern
    };
    
    enemiesRef.current.push(enemy);
  };
  
  const spawnBullet = (x, y) => {
    const bullet = {
      id: Date.now(),
      x,
      y,
      width: BULLET_SIZE,
      height: BULLET_SIZE * 2
    };
    
    bulletsRef.current.push(bullet);
  };
  
  const spawnExplosion = (x, y) => {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 5 + 2;
      const particle = {
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: Math.random() * 4 + 2,
        color: '#fbbf24',
        life: 20
      };
      
      particlesRef.current.push(particle);
    }
  };
  
  const checkCollision = (obj1, obj2) => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  };
  
  const die = () => {
    setDeaths(prev => prev + 1);
    // Reset position
    if (playerRef.current) {
      playerRef.current.x = canvasRef.current.width / 2;
      playerRef.current.y = canvasRef.current.height - PLAYER_SIZE - 50;
      playerRef.current.isDead = true;
    }
    
    // Show temporary damage effect
    setGameOver(true);
    setTimeout(() => setGameOver(false), 500);
  };
  
  const completeLevel = () => {
    setGameState('complete');
    
    // Update best scores
    if (score > bestScore) {
      setBestScore(score);
    }
    if (timeElapsed < (bestTime || Infinity)) {
      setBestTime(timeElapsed);
    }
    
    // Save progress
    saveProgress();
    
    // Show completion
    setTimeout(() => {
      if (currentLevelIndex < levels.length - 1) {
        nextLevel();
      } else {
        setGameState('complete');
      }
    }, 2000);
  };
  
  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      const nextIndex = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIndex);
      setScore(0);
      setKills(0);
      setTimeElapsed(0);
      setGameState('playing');
    }
  };
  
  const restartLevel = () => {
    setScore(0);
    setKills(0);
    setTimeElapsed(0);
    setDeaths(0);
    setGameOver(false);
    setGameState('playing');
    
    // Reset player position
    if (playerRef.current) {
      playerRef.current.x = canvasRef.current.width / 2;
      playerRef.current.y = canvasRef.current.height - PLAYER_SIZE - 50;
      playerRef.current.isDead = false;
    }
  };
  
  const saveProgress = () => {
    const progress = {
      session_token: localStorage.getItem('playerToken'),
      game_id: game?.id,
      level_id: currentLevel?.id,
      score,
      kills,
      time_elapsed: timeElapsed,
      completed: gameState === 'complete' ? 1 : 0,
      deaths,
      best_score: bestScore,
      best_time: bestTime
    };
    
    api.post('/play/session/complete', progress)
      .catch(err => console.error('Error saving progress:', err));
  };
  
  const handleKeyPress = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (gameOver) {
        restartLevel();
      } else if (gameState === 'complete') {
        if (currentLevelIndex < levels.length - 1) {
          nextLevel();
        }
      }
    }
  };
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, gameState, currentLevelIndex, levels.length]);
  
  // Initialize game state
  useEffect(() => {
    if (game && currentLevel && selectedShip && selectedWeapon) {
      playerRef.current = {
        x: canvasRef.current.width / 2,
        y: canvasRef.current.height - PLAYER_SIZE - 50,
        isDead: false,
        shooting: false
      };
      
      bulletsRef.current = [];
      enemiesRef.current = [];
      particlesRef.current = [];
      
      setScore(0);
      setKills(0);
      setTimeElapsed(0);
      setDeaths(0);
      setGameState('playing');
    }
  }, [game, currentLevel, selectedShip, selectedWeapon]);
  
  if (gameState === 'loading' || !game || !currentLevel || !selectedShip || !selectedWeapon) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading Space Shooter...</h2>
          <p>Preparing levels and assets...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={currentLevel.width}
        height={currentLevel.height}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      
      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
        {/* Left side info */}
        <div style={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', padding: '12px', pointerEvents: 'auto' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Space Shooter</div>
          <div style={{ fontSize: '14px' }}>Level {currentLevelIndex + 1} of {levels.length}</div>
          <div style={{ fontSize: '14px' }}>Target: {currentLevel.target_score > 0 ? currentLevel.target_score : 'None'}</div>
        </div>
        
        {/* Right side controls */}
        <div style={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', padding: '12px', pointerEvents: 'auto' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Controls</div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>← → Arrow Keys / A/D to move</div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>SPACE / W/↑ to shoot</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Mobile: Tap right side of screen</div>
        </div>
      </div>
      
      {/* Level Select Modal */}
      {showLevelSelect && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Select Level</h2>
            <div style={{ maxHeight: '300px', overflow: 'auto', marginBottom: '16px' }}>
              {levels.map((level, index) => (
                <div
                  key={level.id}
                  onClick={() => {
                    setCurrentLevelIndex(index);
                    setShowLevelSelect(false);
                  }}
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    background: index === currentLevelIndex ? '#e3f2fd' : '#fff',
                    ':hover': { background: '#f5f5f5' }
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => {
                    if (index !== currentLevelIndex) e.target.style.background = '#fff';
                    else e.target.style.background = '#e3f2fd';
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{level.level_name}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Size: {level.width} × {level.height}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Target: {level.target_score > 0 ? level.target_score : 'None'}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLevelSelect(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Over Overlay */}
      {gameOver && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginBottom: '16px' }}>Game Over!</h2>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>Score: {score}</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>Kills: {kills}</div>
            <div style={{ fontSize: '18px', marginBottom: '8d' }}>Deaths: {deaths}</div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</div>
            <button
              onClick={restartLevel}
              style={{
                padding: '12px 24px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Restart Level
            </button>
          </div>
        </div>
      )}
      
      {/* Level Complete Overlay */}
      {gameState === 'complete' && currentLevelIndex < levels.length - 1 && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', marginBottom: '16px' }}>Level Complete!</h2>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>Score: {score}</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>Kills: {kills}</div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</div>
            <button
              onClick={nextLevel}
              style={{
                padding: '12px 24px',
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Next Level
            </button>
          </div>
        </div>
      )}
      
      {gameState === 'complete' && currentLevelIndex >= levels.length - 1 && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '16px' }}>All Levels Completed!</h2>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>Final Score: {score}</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>Total Kills: {kills}</div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>Best Score: {bestScore}</div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>Best Time: {bestTime ? `${Math.floor(bestTime / 60)}:${(bestTime % 60).toString().padStart(2, '0')}` : 'N/A'}</div>
            <button
              onClick={() => setShowLevelSelect(true)}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Select Level
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpacePlayerPage;