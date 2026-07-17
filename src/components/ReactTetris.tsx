import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Award, Volume2, VolumeX, ArrowDown, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24; // in pixels for rendering sizing

// Tetromino colors in neon styled glowing themes
const SHAPES = {
  I: {
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#06b6d4', // Cyan
    glow: 'rgba(6, 182, 212, 0.4)'
  },
  O: {
    matrix: [
      [1, 1],
      [1, 1],
    ],
    color: '#eab308', // Yellow
    glow: 'rgba(234, 179, 8, 0.4)'
  },
  T: {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a855f7', // Purple
    glow: 'rgba(168, 85, 247, 0.4)'
  },
  S: {
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#22c55e', // Green
    glow: 'rgba(34, 197, 94, 0.4)'
  },
  Z: {
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#ef4444', // Red
    glow: 'rgba(239, 68, 68, 0.4)'
  },
  J: {
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#3b82f6', // Blue
    glow: 'rgba(59, 130, 246, 0.4)'
  },
  L: {
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f97316', // Orange
    glow: 'rgba(249, 115, 22, 0.4)'
  }
};

type PieceKey = keyof typeof SHAPES;
const PIECES: PieceKey[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export default function ReactTetris() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('unblocked_tetris_high_score') || 0);
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [sound, setSound] = useState(true);

  // References for live game loop to bypass React render closure traps
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const linesRef = useRef(0);
  const gridRef = useRef<string[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
  
  const currentPieceRef = useRef<{
    matrix: number[][];
    color: string;
    glow: string;
    x: number;
    y: number;
  } | null>(null);

  const nextPieceKeyRef = useRef<PieceKey>('I');
  const [nextPieceKey, setNextPieceKey] = useState<PieceKey>('I');

  const dropCounterRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);

  // Sound generator
  const playSound = useCallback((freq: number, type: OscillatorType, duration: number) => {
    if (!sound) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context error block
    }
  }, [sound]);

  // Select next random piece
  const getRandomPiece = (): PieceKey => {
    const idx = Math.floor(Math.random() * PIECES.length);
    return PIECES[idx];
  };

  // Create a piece object
  const createPiece = (key: PieceKey) => {
    const proto = SHAPES[key];
    return {
      matrix: proto.matrix.map(row => [...row]),
      color: proto.color,
      glow: proto.glow,
      x: Math.floor(COLS / 2) - Math.floor(proto.matrix[0].length / 2),
      y: 0
    };
  };

  const spawnPiece = useCallback(() => {
    const currentKey = nextPieceKeyRef.current;
    const nextKey = getRandomPiece();
    
    currentPieceRef.current = createPiece(currentKey);
    nextPieceKeyRef.current = nextKey;
    setNextPieceKey(nextKey);

    // Check immediate collision at spawn
    if (checkCollision(currentPieceRef.current.x, currentPieceRef.current.y, currentPieceRef.current.matrix)) {
      setGameOver(true);
      setIsPlaying(false);
      playSound(150, 'sawtooth', 0.6);
    }
  }, [playSound]);

  // Collision detection
  const checkCollision = (ax: number, ay: number, matrix: number[][]): boolean => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const nextX = ax + c;
          const nextY = ay + r;
          
          if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
            return true;
          }
          
          if (nextY >= 0 && gridRef.current[nextY][nextX] !== '') {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Merge current piece to the grid
  const mergePiece = () => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] !== 0) {
          const boardY = piece.y + r;
          const boardX = piece.x + c;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            gridRef.current[boardY][boardX] = piece.color;
          }
        }
      }
    }
  };

  // Clear filled rows
  const clearRows = useCallback(() => {
    let cleared = 0;
    const currentGrid = gridRef.current;
    
    for (let r = ROWS - 1; r >= 0; r--) {
      const isRowFull = currentGrid[r].every(val => val !== '');
      if (isRowFull) {
        currentGrid.splice(r, 1);
        currentGrid.unshift(Array(COLS).fill(''));
        cleared++;
        r++; // Check same row index again after unshift
      }
    }

    if (cleared > 0) {
      linesRef.current += cleared;
      setLines(linesRef.current);
      
      const scoreValues = [0, 100, 300, 500, 800];
      const addedScore = scoreValues[Math.min(cleared, 4)] * levelRef.current;
      scoreRef.current += addedScore;
      setScore(scoreRef.current);

      // Level logic
      const nextLvl = Math.floor(linesRef.current / 10) + 1;
      if (nextLvl > levelRef.current) {
        levelRef.current = nextLvl;
        setLevel(nextLvl);
        playSound(520, 'sine', 0.2);
        setTimeout(() => playSound(660, 'sine', 0.25), 100);
      } else {
        playSound(440, 'triangle', 0.15);
      }
    }
  }, [playSound]);

  // Rotates matrix clockwise
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const n = matrix.length;
    const res = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        res[c][n - 1 - r] = matrix[r][c];
      }
    }
    return res;
  };

  // Rotation handler with wall kick checks
  const rotatePiece = () => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    const rotated = rotateMatrix(piece.matrix);
    const originalX = piece.x;
    let offset = 1;

    // Wall kick attempt
    while (checkCollision(piece.x, piece.y, rotated)) {
      piece.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (Math.abs(offset) > piece.matrix[0].length) {
        // Rotation not possible, revert
        piece.x = originalX;
        return;
      }
    }
    piece.matrix = rotated;
    playSound(350, 'sine', 0.05);
  };

  const movePiece = (dir: number) => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    if (!checkCollision(piece.x + dir, piece.y, piece.matrix)) {
      piece.x += dir;
      playSound(280, 'sine', 0.03);
    }
  };

  const dropPiece = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    if (!checkCollision(piece.x, piece.y + 1, piece.matrix)) {
      piece.y += 1;
    } else {
      mergePiece();
      clearRows();
      spawnPiece();
    }
    dropCounterRef.current = 0;
  }, [clearRows, spawnPiece]);

  // Instantly drop piece to the bottom
  const hardDropPiece = () => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    let dropped = 0;
    while (!checkCollision(piece.x, piece.y + 1, piece.matrix)) {
      piece.y += 1;
      dropped++;
    }
    
    scoreRef.current += dropped * 2;
    setScore(scoreRef.current);
    
    mergePiece();
    clearRows();
    spawnPiece();
    playSound(180, 'triangle', 0.1);
  };

  // Reset/Start game
  const startGame = () => {
    gridRef.current = Array(ROWS).fill(null).map(() => Array(COLS).fill(''));
    scoreRef.current = 0;
    levelRef.current = 1;
    linesRef.current = 0;
    
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    
    nextPieceKeyRef.current = getRandomPiece();
    spawnPiece();
    
    setIsPlaying(true);
    lastTimeRef.current = performance.now();
    dropCounterRef.current = 0;
    playSound(440, 'triangle', 0.15);
  };

  // Render core canvas board
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sizing computation for canvas
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear canvas with deep space charcoal
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    // Draw grid background subtle matrix dots or thin lines
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.2)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK_SIZE, 0);
      ctx.lineTo(c * BLOCK_SIZE, h);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK_SIZE);
      ctx.lineTo(w, r * BLOCK_SIZE);
      ctx.stroke();
    }

    // Render Grid Placed Blocks
    const currentGrid = gridRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const blockColor = currentGrid[r][c];
        if (blockColor !== '') {
          drawBlock(ctx, c, r, blockColor);
        }
      }
    }

    // Render Active Piece
    const piece = currentPieceRef.current;
    if (piece) {
      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (piece.matrix[r][c] !== 0) {
            const blockX = piece.x + c;
            const blockY = piece.y + r;
            if (blockY >= 0) {
              drawBlock(ctx, blockX, blockY, piece.color, piece.glow);
            }
          }
        }
      }

      // Draw active drop ghost projection guide line
      let ghostY = piece.y;
      while (!checkCollision(piece.x, ghostY + 1, piece.matrix)) {
        ghostY++;
      }
      if (ghostY > piece.y) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        for (let r = 0; r < piece.matrix.length; r++) {
          for (let c = 0; c < piece.matrix[r].length; c++) {
            if (piece.matrix[r][c] !== 0) {
              const blockX = piece.x + c;
              const blockY = ghostY + r;
              ctx.strokeRect(blockX * BLOCK_SIZE + 1, blockY * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            }
          }
        }
        ctx.setLineDash([]); // Reset
      }
    }
  }, []);

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow?: string) => {
    // Fill block
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

    // Bevel edges decoration for shiny futuristic design
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, 2); // Top
    ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, 2, BLOCK_SIZE - 2); // Left

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x * BLOCK_SIZE + 1, (y + 1) * BLOCK_SIZE - 3, BLOCK_SIZE - 2, 2); // Bottom
    ctx.fillRect((x + 1) * BLOCK_SIZE - 3, y * BLOCK_SIZE + 1, 2, BLOCK_SIZE - 2); // Right

    // Optional glow background aura
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
      ctx.shadowBlur = 0; // reset
    }
  };

  // Keyboard listening controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          movePiece(-1);
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyD':
          movePiece(1);
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 'KeyS':
          dropPiece();
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'KeyW':
          rotatePiece();
          e.preventDefault();
          break;
        case 'Space':
          hardDropPiece();
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, gameOver, dropPiece]);

  // Main game ticker loop
  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      return;
    }

    const speed = Math.max(80, 750 - (levelRef.current - 1) * 75); // Level speed formula

    const loop = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      dropCounterRef.current += delta;
      if (dropCounterRef.current >= speed) {
        dropPiece();
      }

      draw();
      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, gameOver, dropPiece, draw]);

  // Handle final high scores
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('unblocked_tetris_high_score', score.toString());
    }
  }, [score, highScore]);

  // Render Initial View
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full p-4 max-w-4xl">
      {/* Game Canvas Container */}
      <div className="relative">
        <div className="p-2.5 bg-zinc-950 rounded-2xl border-2 border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.15)] overflow-hidden">
          <canvas
            ref={canvasRef}
            width={COLS * BLOCK_SIZE}
            height={ROWS * BLOCK_SIZE}
            className="block rounded-lg"
          />
        </div>

        {/* OVERLAYS: Start, Game Over */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 rounded-2xl backdrop-blur-sm flex flex-col justify-center items-center p-6 text-center border border-zinc-800">
            {!gameOver ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-indigo-600/15 border border-indigo-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                  <Play className="w-8 h-8 text-indigo-400 fill-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-mono tracking-wider text-white">NEON TETRIS</h3>
                  <p className="text-zinc-500 text-xs mt-1">Arrow keys or WASD to fit and rotate the falling blocks.</p>
                </div>
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold tracking-widest rounded-lg transition transform active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                >
                  START ARCADE
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-red-600/15 border border-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <RotateCcw className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-mono tracking-wider text-red-500">GAME OVER</h3>
                  <p className="text-zinc-500 text-xs mt-1">You reached the top limit with a final score of <span className="text-white font-bold">{score}</span>.</p>
                </div>
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold tracking-widest rounded-lg transition transform active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                >
                  TRY AGAIN
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control specs side-panel */}
      <div className="flex flex-col gap-6 w-full max-w-xs">
        {/* Next shape preview & stats block */}
        <div className="bg-[#0c0c0e] p-5 rounded-xl border border-zinc-800 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
            <span className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-widest">Grid Stats</span>
            <button
              onClick={() => setSound(!sound)}
              className="p-1 hover:bg-zinc-800 rounded transition text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              {sound ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-zinc-500 block">SCORE</span>
              <span className="text-xl font-bold font-mono text-white tracking-tight">{score}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-zinc-500 block">HIGH SCORE</span>
              <span className="text-xl font-bold font-mono text-indigo-400 tracking-tight flex items-center gap-1">
                <Award className="w-4 h-4 shrink-0 text-yellow-500" /> {highScore}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-zinc-500 block">LEVEL</span>
              <span className="text-lg font-bold font-mono text-white">{level}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-zinc-500 block">LINES CLEARED</span>
              <span className="text-lg font-bold font-mono text-white">{lines}</span>
            </div>
          </div>

          {/* Next block render queue */}
          <div className="border-t border-zinc-800/60 pt-3">
            <span className="text-[10px] font-mono text-zinc-500 block mb-2">NEXT TETROMINO</span>
            <div className="flex items-center justify-center bg-zinc-950 p-3 rounded-lg border border-zinc-900 h-16">
              {isPlaying && (
                <div className="flex gap-1.5 flex-col items-center">
                  {SHAPES[nextPieceKey].matrix.slice(0, 3).map((row, rIdx) => {
                    const hasActive = row.some(val => val !== 0);
                    if (!hasActive && rIdx > 0) return null;
                    return (
                      <div key={rIdx} className="flex gap-1">
                        {row.map((cell, cIdx) => (
                          <div
                            key={cIdx}
                            className={`w-3.5 h-3.5 rounded-sm ${
                              cell !== 0 ? '' : 'opacity-0 bg-transparent'
                            }`}
                            style={{ backgroundColor: cell !== 0 ? SHAPES[nextPieceKey].color : undefined }}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Responsive Mobile On-screen Controllers */}
        <div className="bg-[#0c0c0e]/80 p-4 rounded-xl border border-zinc-800/80 space-y-3">
          <span className="text-[10px] font-mono text-zinc-500 block text-center uppercase tracking-widest">Mobile Directional Pads</span>
          <div className="grid grid-cols-3 gap-2 max-w-[210px] mx-auto">
            <div />
            <button
              onClick={() => rotatePiece()}
              disabled={!isPlaying || gameOver}
              className="w-12 h-12 bg-zinc-900 active:bg-zinc-800 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-zinc-300 flex items-center justify-center active:scale-90 transition disabled:opacity-40 select-none cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div />

            <button
              onClick={() => movePiece(-1)}
              disabled={!isPlaying || gameOver}
              className="w-12 h-12 bg-zinc-900 active:bg-zinc-800 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-zinc-300 flex items-center justify-center active:scale-90 transition disabled:opacity-40 select-none cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => dropPiece()}
              disabled={!isPlaying || gameOver}
              className="w-12 h-12 bg-zinc-900 active:bg-zinc-800 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-zinc-300 flex items-center justify-center active:scale-90 transition disabled:opacity-40 select-none cursor-pointer"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => movePiece(1)}
              disabled={!isPlaying || gameOver}
              className="w-12 h-12 bg-zinc-900 active:bg-zinc-800 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-zinc-300 flex items-center justify-center active:scale-90 transition disabled:opacity-40 select-none cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => hardDropPiece()}
            disabled={!isPlaying || gameOver}
            className="w-full py-2 bg-indigo-600/15 border border-indigo-500/20 active:bg-indigo-600/30 text-indigo-400 font-mono text-xs rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 select-none"
          >
            Hard Drop (Space)
          </button>
        </div>
      </div>
    </div>
  );
}
