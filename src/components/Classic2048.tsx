import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Award, HelpCircle } from 'lucide-react';

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  merged?: boolean;
}

export default function Classic2048() {
  const [board, setBoard] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('neon_2048_high_score') || 0);
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [tileIdCounter, setTileIdCounter] = useState(0);

  // Initialize game
  const initializeGame = useCallback(() => {
    let currentId = 0;
    const initialBoard: Tile[] = [];
    
    // Add two random tiles
    const addRandomTile = (tempBoard: Tile[]) => {
      const emptySpots: { r: number; c: number }[] = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!tempBoard.some(t => t.row === r && t.col === c)) {
            emptySpots.push({ r, c });
          }
        }
      }
      if (emptySpots.length > 0) {
        const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        tempBoard.push({
          id: currentId++,
          value,
          row: spot.r,
          col: spot.c
        });
      }
    };

    addRandomTile(initialBoard);
    addRandomTile(initialBoard);

    setBoard(initialBoard);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    setTileIdCounter(currentId);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('neon_2048_high_score', score.toString());
    }
  }, [score, highScore]);

  // Check if there are any valid moves remaining
  const checkGameOver = (tiles: Tile[]) => {
    if (tiles.length < 16) return false;

    // Create 4x4 grid representation
    const grid = Array(4).fill(null).map(() => Array(4).fill(0));
    tiles.forEach(t => {
      grid[t.row][t.col] = t.value;
    });

    // Check for adjacent matching numbers
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = grid[r][c];
        if (r < 3 && grid[r + 1][c] === val) return false;
        if (c < 3 && grid[r][c + 1] === val) return false;
      }
    }
    return true;
  };

  // Main move handler
  const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver || (won && !keepPlaying)) return;

    setBoard(prevBoard => {
      let tempBoard = [...prevBoard].map(t => ({ ...t, merged: false }));
      let nextId = tileIdCounter;
      let moved = false;
      let scoreIncrement = 0;

      // Determine lines and parsing orders
      const getLine = (index: number) => {
        if (direction === 'LEFT' || direction === 'RIGHT') {
          return tempBoard.filter(t => t.row === index);
        } else {
          return tempBoard.filter(t => t.col === index);
        }
      };

      const sortLine = (line: Tile[]) => {
        if (direction === 'LEFT') return line.sort((a, b) => a.col - b.col);
        if (direction === 'RIGHT') return line.sort((a, b) => b.col - a.col);
        if (direction === 'UP') return line.sort((a, b) => a.row - b.row);
        return line.sort((a, b) => b.row - a.row);
      };

      const setCoords = (tile: Tile, lineIndex: number, positionInLine: number) => {
        if (direction === 'LEFT') {
          tile.row = lineIndex;
          tile.col = positionInLine;
        } else if (direction === 'RIGHT') {
          tile.row = lineIndex;
          tile.col = 3 - positionInLine;
        } else if (direction === 'UP') {
          tile.row = positionInLine;
          tile.col = lineIndex;
        } else {
          tile.row = 3 - positionInLine;
          tile.col = lineIndex;
        }
      };

      // Process each row/col independently
      const nextBoard: Tile[] = [];

      for (let i = 0; i < 4; i++) {
        const line = getLine(i);
        const sorted = sortLine(line);
        const newLine: Tile[] = [];

        for (let j = 0; j < sorted.length; j++) {
          const current = sorted[j];
          if (j + 1 < sorted.length && sorted[j + 1].value === current.value) {
            // Merge
            const mergedValue = current.value * 2;
            scoreIncrement += mergedValue;
            if (mergedValue === 2048) {
              setWon(true);
            }
            newLine.push({
              id: nextId++,
              value: mergedValue,
              row: 0, // Temp
              col: 0, // Temp
              merged: true
            });
            moved = true;
            j++; // Skip next
          } else {
            newLine.push({ ...current });
          }
        }

        // Check if positions actually changed
        sorted.forEach((orig, idx) => {
          const targetCoords = { row: 0, col: 0 };
          const dummy = { ...orig, row: 0, col: 0 };
          setCoords(dummy, i, idx);
          if (orig.row !== dummy.row || orig.col !== dummy.col) {
            moved = true;
          }
        });

        // Assign new coords in line
        newLine.forEach((tile, idx) => {
          setCoords(tile, i, idx);
          nextBoard.push(tile);
        });

        if (newLine.length !== sorted.length) {
          moved = true;
        }
      }

      if (!moved) return prevBoard; // No moves happened

      // Add random tile
      const emptySpots: { r: number; c: number }[] = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!nextBoard.some(t => t.row === r && t.col === c)) {
            emptySpots.push({ r, c });
          }
        }
      }

      if (emptySpots.length > 0) {
        const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        nextBoard.push({
          id: nextId++,
          value,
          row: spot.r,
          col: spot.c
        });
      }

      setTileIdCounter(nextId);
      setScore(prev => prev + scoreIncrement);

      if (checkGameOver(nextBoard)) {
        setGameOver(true);
      }

      return nextBoard;
    });
  }, [gameOver, won, keepPlaying, tileIdCounter]);

  // Handle keyboard arrow presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        move('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        move('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        move('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        move('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch controls state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStart.x;
    const diffY = touch.clientY - touchStart.y;
    
    // Threshold
    if (Math.abs(diffX) > 40 || Math.abs(diffY) > 40) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) move('RIGHT');
        else move('LEFT');
      } else {
        if (diffY > 0) move('DOWN');
        else move('UP');
      }
    }
    setTouchStart(null);
  };

  const getTileStyles = (val: number) => {
    switch (val) {
      case 2: return 'bg-zinc-800 text-zinc-300 border-zinc-700 shadow-[0_0_8px_rgba(255,255,255,0.02)]';
      case 4: return 'bg-zinc-700 text-zinc-100 border-zinc-600 shadow-[0_0_10px_rgba(255,255,255,0.05)]';
      case 8: return 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]';
      case 16: return 'bg-indigo-900/90 text-indigo-200 border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.35)]';
      case 32: return 'bg-purple-950/80 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]';
      case 64: return 'bg-purple-900/90 text-purple-200 border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.35)]';
      case 128: return 'bg-pink-950/80 text-pink-300 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.3)]';
      case 256: return 'bg-pink-900/90 text-pink-200 border-pink-400/60 shadow-[0_0_20px_rgba(236,72,153,0.45)]';
      case 512: return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]';
      case 1024: return 'bg-cyan-900/90 text-cyan-200 border-cyan-400/70 shadow-[0_0_25px_rgba(6,182,212,0.5)]';
      case 2048: return 'bg-emerald-950/85 text-emerald-300 border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.7)] font-bold';
      default: return 'bg-amber-950/90 text-amber-200 border-amber-500/90 shadow-[0_0_40px_rgba(245,158,11,0.8)] font-bold';
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      
      {/* HUD Header bar */}
      <div className="w-full flex justify-between items-center bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-indigo-400 font-bold tracking-widest uppercase">Classic Puzzle</span>
          <h2 className="text-lg font-black font-mono tracking-tight text-white flex items-center gap-1.5">
            NEON 2048
          </h2>
        </div>

        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-zinc-950 rounded-lg border border-zinc-800/60 flex flex-col items-center">
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Score</span>
            <span className="text-sm font-bold font-mono text-zinc-100">{score}</span>
          </div>

          <div className="px-3 py-1.5 bg-zinc-950 rounded-lg border border-zinc-800/60 flex flex-col items-center">
            <span className="text-[8px] font-mono text-zinc-500 uppercase flex items-center gap-0.5"><Trophy className="w-2 h-2 text-amber-400" /> Best</span>
            <span className="text-sm font-bold font-mono text-amber-400">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Main 4x4 Grid Board Container */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full aspect-square bg-zinc-950 border border-zinc-800 rounded-2xl p-3 grid grid-cols-4 grid-rows-4 gap-3 select-none touch-none overflow-hidden"
      >
        {/* Empty background slots */}
        {Array(16).fill(0).map((_, i) => (
          <div 
            key={`slot-${i}`} 
            className="w-full h-full bg-zinc-900/30 border border-zinc-900 rounded-xl"
          />
        ))}

        {/* Dynamic active tiles */}
        <AnimatePresence>
          {board.map(tile => {
            // Absolute positioning depending on row and col
            const style = {
              gridRowStart: tile.row + 1,
              gridColumnStart: tile.col + 1,
            };

            return (
              <motion.div
                key={tile.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={style}
                className={`w-full h-full rounded-xl border flex items-center justify-center font-mono text-xl sm:text-2xl font-black select-none z-10 transition-shadow ${getTileStyles(tile.value)}`}
              >
                {tile.value}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Game Over Screen Overlay */}
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-3 z-30"
          >
            <Award className="w-12 h-12 text-rose-500 animate-bounce" />
            <h3 className="text-rose-500 font-black font-mono tracking-tight text-xl uppercase">Game Over</h3>
            <p className="text-zinc-500 text-xs text-center max-w-[240px] leading-normal">
              No empty slots or adjacent matching blocks. Score: <span className="font-bold text-white">{score}</span>
            </p>
            <button
              onClick={initializeGame}
              className="mt-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </motion.div>
        )}

        {/* Game Won Screen Overlay */}
        {won && !keepPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-3 z-30"
          >
            <Trophy className="w-12 h-12 text-emerald-400 animate-pulse" />
            <h3 className="text-emerald-400 font-black font-mono tracking-tight text-xl uppercase">2048 Reached!</h3>
            <p className="text-zinc-400 text-xs text-center max-w-[240px] leading-normal">
              You are a master of mathematics! You earned <span className="font-bold text-white">{score}</span> points.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setKeepPlaying(true)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold rounded-lg border border-zinc-700 cursor-pointer"
              >
                Keep Playing
              </button>
              <button
                onClick={initializeGame}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-lg cursor-pointer"
              >
                Reset Grid
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Controller Guide Bar */}
      <div className="w-full flex justify-between items-center text-[10px] font-mono text-zinc-500 px-1 bg-zinc-900/20 py-2 border border-zinc-800/40 rounded-lg">
        <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-zinc-400" /> Use Arrow keys or swipe screen</span>
        <button 
          onClick={initializeGame}
          className="hover:text-white transition flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Force Reset
        </button>
      </div>

    </div>
  );
}
