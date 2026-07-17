import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Award, ShieldCheck, Heart, Sparkles, SlidersHorizontal } from 'lucide-react';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  hits: number; // For multi-hit bricks
}

interface PowerUp {
  x: number;
  y: number;
  type: 'EXPAND' | 'MULTIBALL' | 'LIFE';
  width: number;
  height: number;
  color: string;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
}

export default function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game state controllers
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('neon_breaker_high_score') || 0);
  });
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  // References for live game state loop (to avoid closure issues in requestAnimationFrame)
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const paddleRef = useRef({ x: 160, y: 440, width: 80, height: 12, speed: 8 });
  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Touch drag state
  const isDraggingRef = useRef(false);

  // Start/Restart level config
  const initLevel = (lvl: number) => {
    scoreRef.current = score;
    livesRef.current = lives;
    
    // Default single ball
    ballsRef.current = [
      { x: 200, y: 420, dx: 3 + lvl * 0.5, dy: -4 - lvl * 0.5, radius: 6 }
    ];
    
    // Paddle resetting
    paddleRef.current = { x: 160, y: 440, width: 80, height: 12, speed: 8 };
    powerUpsRef.current = [];
    particlesRef.current = [];

    // Bricks build logic based on lvl
    const brickRows = 3 + lvl; // increase row on higher level
    const brickCols = 8;
    const padding = 6;
    const offsetTop = 40;
    const offsetLeft = 14;
    const width = 42;
    const height = 15;

    const brickColors = [
      '#ef4444', // Red
      '#f59e0b', // Orange
      '#3b82f6', // Blue
      '#10b981', // Emerald
      '#a855f7', // Purple
      '#ec4899'  // Pink
    ];

    const newBricks: Brick[] = [];
    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        const brickX = c * (width + padding) + offsetLeft;
        const brickY = r * (height + padding) + offsetTop;
        const color = brickColors[r % brickColors.length];
        
        newBricks.push({
          x: brickX,
          y: brickY,
          width,
          height,
          color,
          points: (brickRows - r) * 10,
          hits: r === 0 ? 2 : 1 // top layer needs 2 hits
        });
      }
    }
    bricksRef.current = newBricks;
  };

  const handleStartGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    scoreRef.current = 0;
    livesRef.current = 3;
    setGameOver(false);
    setGameWon(false);
    setIsPlaying(true);
    initLevel(1);
  };

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: Math.random() * 3 + 1.5,
        color,
        alpha: 1,
        life: 30 + Math.random() * 20
      });
    }
  };

  // Keyboard Event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ' && !isPlaying && !gameOver && !gameWon) {
        handleStartGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, gameOver, gameWon]);

  // Main game loop engine
  useEffect(() => {
    if (!isPlaying || gameOver || gameWon) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateGame = () => {
      // 1. Paddle movement
      const paddle = paddleRef.current;
      if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) {
        paddle.x = Math.max(0, paddle.x - paddle.speed);
      }
      if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) {
        paddle.x = Math.min(canvas.width - paddle.width, paddle.x + paddle.speed);
      }

      // 2. PowerUps updates
      powerUpsRef.current.forEach((pu, index) => {
        pu.y += 2.5; // drop downwards
        
        // Power-up collides with paddle
        if (
          pu.y + pu.height >= paddle.y &&
          pu.y <= paddle.y + paddle.height &&
          pu.x + pu.width >= paddle.x &&
          pu.x <= paddle.x + paddle.width
        ) {
          // Trigger power-up benefit
          if (pu.type === 'EXPAND') {
            paddle.width = Math.min(140, paddle.width + 30);
            // Spawn sparklers
            spawnParticles(pu.x, pu.y, '#ec4899');
          } else if (pu.type === 'MULTIBALL') {
            const firstBall = ballsRef.current[0] || { x: 200, y: 200, dx: 3, dy: -3 };
            ballsRef.current.push({
              x: firstBall.x,
              y: firstBall.y,
              dx: -firstBall.dx,
              dy: firstBall.dy,
              radius: 6
            });
            spawnParticles(pu.x, pu.y, '#06b2d2');
          } else if (pu.type === 'LIFE') {
            livesRef.current = Math.min(5, livesRef.current + 1);
            setLives(livesRef.current);
            spawnParticles(pu.x, pu.y, '#10b981');
          }
          // Remove power up
          powerUpsRef.current.splice(index, 1);
        } else if (pu.y > canvas.height) {
          // Offscreen removal
          powerUpsRef.current.splice(index, 1);
        }
      });

      // 3. Balls updates
      const balls = ballsRef.current;
      const bricks = bricksRef.current;

      balls.forEach((ball, bIdx) => {
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Bounce left/right walls
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.dx = -ball.dx;
        } else if (ball.x + ball.radius >= canvas.width) {
          ball.x = canvas.width - ball.radius;
          ball.dx = -ball.dx;
        }

        // Bounce top ceiling
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.dy = -ball.dy;
        }

        // Bounce paddle
        if (
          ball.y + ball.radius >= paddle.y &&
          ball.y - ball.radius <= paddle.y + paddle.height &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.width
        ) {
          ball.dy = -Math.abs(ball.dy);
          // Angle shifts based on where on paddle it lands
          const center = paddle.x + paddle.width / 2;
          const hitPosition = ball.x - center;
          ball.dx = hitPosition * 0.12;
        }

        // Check Brick collisions
        for (let i = bricks.length - 1; i >= 0; i--) {
          const brick = bricks[i];
          if (
            ball.x + ball.radius >= brick.x &&
            ball.x - ball.radius <= brick.x + brick.width &&
            ball.y + ball.radius >= brick.y &&
            ball.y - ball.radius <= brick.y + brick.height
          ) {
            // Collision detected! Flip Y speed
            ball.dy = -ball.dy;
            
            // Reduce hits
            brick.hits -= 1;
            spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);

            if (brick.hits <= 0) {
              // Add score
              scoreRef.current += brick.points;
              setScore(scoreRef.current);

              // Power-up chance (15%)
              if (Math.random() < 0.15) {
                const types: ('EXPAND' | 'MULTIBALL' | 'LIFE')[] = ['EXPAND', 'MULTIBALL', 'LIFE'];
                const selectedType = types[Math.floor(Math.random() * types.length)];
                const colors = { EXPAND: '#ec4899', MULTIBALL: '#06b2d2', LIFE: '#10b981' };
                
                powerUpsRef.current.push({
                  x: brick.x + brick.width / 2 - 8,
                  y: brick.y + brick.height,
                  type: selectedType,
                  width: 16,
                  height: 16,
                  color: colors[selectedType]
                });
              }

              // Splice brick
              bricks.splice(i, 1);
            }
            break; // Stop nested brick loops
          }
        }

        // Fall out of bottom bound
        if (ball.y - ball.radius > canvas.height) {
          balls.splice(bIdx, 1);
        }
      });

      // 4. Fallback check if no balls are left
      if (ballsRef.current.length === 0) {
        livesRef.current -= 1;
        setLives(livesRef.current);

        if (livesRef.current <= 0) {
          setGameOver(true);
          setIsPlaying(false);
          // Record high score
          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem('neon_breaker_high_score', scoreRef.current.toString());
          }
        } else {
          // Re-create a standard initial ball
          ballsRef.current = [
            { x: 200, y: 420, dx: 3.5, dy: -4.5, radius: 6 }
          ];
          paddleRef.current.x = 160;
          paddleRef.current.width = 80; // reset expansion benefits on death
        }
      }

      // 5. Stage cleared check
      if (bricksRef.current.length === 0) {
        // Next level or Game Victory
        if (level < 3) {
          const nextLvl = level + 1;
          setLevel(nextLvl);
          initLevel(nextLvl);
        } else {
          setGameWon(true);
          setIsPlaying(false);
          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem('neon_breaker_high_score', scoreRef.current.toString());
          }
        }
      }

      // 6. Particles update
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        p.life -= 1;
        if (p.life <= 0 || p.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
        }
      });
    };

    const drawGame = () => {
      // Clear black background canvas
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decorative ambient glowing borders
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Bricks rendering
      bricksRef.current.forEach(brick => {
        ctx.shadowBlur = 8;
        ctx.shadowColor = brick.color;
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Highlight top shine
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(brick.x, brick.y, brick.width, 3);
        
        // Multi-hit indicator border
        if (brick.hits > 1) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2);
        }
      });

      // Paddle rendering
      const paddle = paddleRef.current;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#818cf8';
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

      // Round paddle caps
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#a5b4fc';
      ctx.fillRect(paddle.x, paddle.y, 4, paddle.height);
      ctx.fillRect(paddle.x + paddle.width - 4, paddle.y, 4, paddle.height);

      // Balls rendering
      ballsRef.current.forEach(ball => {
        ctx.beginPath();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#06b2d2';
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.fill();
        ctx.closePath();
      });

      // PowerUps rendering
      ctx.shadowBlur = 0;
      powerUpsRef.current.forEach(pu => {
        ctx.fillStyle = pu.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = pu.color;
        
        ctx.beginPath();
        // Render diamond shape
        ctx.moveTo(pu.x + pu.width / 2, pu.y);
        ctx.lineTo(pu.x + pu.width, pu.y + pu.height / 2);
        ctx.lineTo(pu.x + pu.width / 2, pu.y + pu.height);
        ctx.lineTo(pu.x, pu.y + pu.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 0;
        ctx.fillText(pu.type[0], pu.x + pu.width / 2, pu.y + pu.height / 2 + 3);
      });

      // Particles rendering
      particlesRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.closePath();
      });
      ctx.globalAlpha = 1.0; // reset
    };

    const loop = () => {
      updateGame();
      drawGame();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameOver, gameWon, level]);

  // Handle Touch dragging move on the Canvas directly
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying || gameOver || gameWon) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;

    // Adjust paddle x centered on drag touch position
    const paddle = paddleRef.current;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, touchX - paddle.width / 2));
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      
      {/* Breaker top HUD statistics */}
      <div className="w-full flex justify-between items-center bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-purple-400 font-bold tracking-widest uppercase">Stage {level}/3</span>
          <h2 className="text-lg font-black font-mono tracking-tight text-white flex items-center gap-1.5">
            NEON BREAKER
          </h2>
        </div>

        <div className="flex gap-2.5">
          <div className="px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-800/60 flex flex-col items-center justify-center">
            <span className="text-[7px] font-mono text-zinc-500 uppercase">Lives</span>
            <div className="flex gap-0.5 mt-0.5">
              {Array(5).fill(0).map((_, idx) => (
                <Heart 
                  key={idx} 
                  className={`w-3 h-3 ${idx < lives ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-zinc-800'}`} 
                />
              ))}
            </div>
          </div>

          <div className="px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-800/60 flex flex-col items-center">
            <span className="text-[7px] font-mono text-zinc-500 uppercase">Score</span>
            <span className="text-xs font-bold font-mono text-zinc-200">{score}</span>
          </div>

          <div className="px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-800/60 flex flex-col items-center">
            <span className="text-[7px] font-mono text-zinc-500 uppercase">High</span>
            <span className="text-xs font-bold font-mono text-indigo-400">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Stage */}
      <div className="relative border border-zinc-800 bg-[#09090b] rounded-2xl p-1 shadow-2xl overflow-hidden w-full aspect-[400/460]">
        <canvas
          ref={canvasRef}
          width={400}
          height={460}
          onTouchStart={() => { isDraggingRef.current = true; }}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => { isDraggingRef.current = false; }}
          className="w-full h-full block bg-[#09090b] cursor-none rounded-xl"
        />

        {/* Start Game overlay */}
        {!isPlaying && !gameOver && !gameWon && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-4 text-center p-6">
            <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="text-white font-black font-mono tracking-tight uppercase text-lg">Neon Brick Breaker</h3>
              <p className="text-zinc-400 text-xs mt-1 max-w-xs leading-relaxed">
                Skill test: Reflect the glowing neutron ball, destroy all brick walls, and collect dropping diamond power-ups to expand!
              </p>
            </div>
            
            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-left text-[9px] font-mono text-zinc-400 space-y-1 w-full max-w-[280px]">
              <div className="flex justify-between"><span>[A/D] or [Arrows]</span><span className="text-zinc-200 font-bold">Move Paddle</span></div>
              <div className="flex justify-between"><span>[M] Power-up</span><span className="text-cyan-400 font-bold">Extra Multi-Ball</span></div>
              <div className="flex justify-between"><span>[E] Power-up</span><span className="text-pink-400 font-bold">Wider Paddle</span></div>
              <div className="flex justify-between"><span>[L] Power-up</span><span className="text-emerald-400 font-bold">+1 Shield Life</span></div>
            </div>

            <button
              onClick={handleStartGame}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs tracking-wider rounded-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4" /> START MISSION
            </button>
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center gap-3 text-center">
            <RotateCcw className="w-12 h-12 text-rose-500 animate-spin" style={{ animationDuration: '6s' }} />
            <h3 className="text-rose-500 font-black font-mono tracking-tight uppercase text-lg">System Defeated</h3>
            <p className="text-zinc-500 text-xs max-w-xs leading-relaxed">
              Shield reserves fully depleted. Your final score is <span className="font-bold text-white">{score}</span> credits.
            </p>
            <button
              onClick={handleStartGame}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs tracking-wider rounded-lg shadow-lg active:scale-95 transition flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <RotateCcw className="w-4 h-4" /> RETRY LEVEL
            </button>
          </div>
        )}

        {/* Game Won victory overlay */}
        {gameWon && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center gap-4 text-center">
            <Award className="w-12 h-12 text-emerald-400 animate-bounce" />
            <div>
              <h3 className="text-emerald-400 font-black font-mono tracking-tight uppercase text-lg">Mission Accomplished</h3>
              <p className="text-zinc-400 text-xs mt-1 max-w-xs leading-relaxed">
                You successfully broke all cosmic shield barriers across all 3 sectors!
              </p>
            </div>
            <div className="p-3 bg-zinc-900 rounded-lg text-zinc-300 font-mono text-xs">
              FINAL HIGH SCORE: <span className="text-amber-400 font-bold">{score}</span>
            </div>
            <button
              onClick={handleStartGame}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs tracking-wider rounded-lg active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Controller instruction bottom bar */}
      <div className="w-full flex justify-between items-center text-[10px] font-mono text-zinc-500 px-1 bg-zinc-900/20 py-2 border border-zinc-800/40 rounded-lg">
        <span className="flex items-center gap-1"><SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" /> Use Arrows or Drag on canvas</span>
        <span className="text-zinc-400 font-bold">Responsive Touch Controls Active</span>
      </div>

    </div>
  );
}
