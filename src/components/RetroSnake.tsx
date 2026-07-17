import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Award, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Volume2, VolumeX } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

export default function RetroSnake() {
  const [snake, setSnake] = useState<Array<{ x: number; y: number }>>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<{ x: number; y: number }>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('unblocked_snake_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [sound, setSound] = useState(true);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const generateFood = useCallback((currentSnake: Array<{ x: number; y: number }>) => {
    while (true) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      const onSnake = currentSnake.some(segment => segment.x === x && segment.y === y);
      if (!onSnake) {
        return { x, y };
      }
    }
  }, []);

  const triggerBeep = (freq: number, type: OscillatorType, duration: number) => {
    if (!sound) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context error or browser permissions
    }
  };

  const resetGame = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ]);
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setFood(generateFood(initialSnake));
    setDirection('UP');
    setIsGameOver(false);
    setScore(0);
    setIsStarted(true);
    triggerBeep(330, 'square', 0.1);
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'].includes(e.code)) {
      e.preventDefault(); // Prevent page scrolling
    }

    if (!isStarted) {
      if (e.code === 'Space' || e.code === 'Enter') {
        resetGame();
        return;
      }
    }

    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        if (direction !== 'DOWN') setDirection('UP');
        break;
      case 'ArrowDown':
      case 'KeyS':
        if (direction !== 'UP') setDirection('DOWN');
        break;
      case 'ArrowLeft':
      case 'KeyA':
        if (direction !== 'RIGHT') setDirection('LEFT');
        break;
      case 'ArrowRight':
      case 'KeyD':
        if (direction !== 'LEFT') setDirection('RIGHT');
        break;
    }
  }, [direction, isStarted]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const moveSnake = useCallback(() => {
    if (isGameOver || !isStarted) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };

      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Check boundaries
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setIsGameOver(true);
        triggerBeep(120, 'sawtooth', 0.4);
        return prevSnake;
      }

      // Check self-collision (excluding the tail if we didn't eat food)
      const selfCollision = prevSnake.some((seg, idx) => {
        if (idx === prevSnake.length - 1) return false; // Tail moves away unless we eat
        return seg.x === head.x && seg.y === head.y;
      });

      if (selfCollision) {
        setIsGameOver(true);
        triggerBeep(120, 'sawtooth', 0.4);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check eating food
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        triggerBeep(523, 'sine', 0.1);
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('unblocked_snake_high_score', newScore.toString());
        }
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isStarted, score, highScore, generateFood]);

  useEffect(() => {
    if (isStarted && !isGameOver) {
      gameLoopRef.current = setInterval(moveSnake, INITIAL_SPEED);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isStarted, isGameOver, moveSnake]);

  return (
    <div className="flex flex-col items-center bg-[#18181b] p-6 rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-xl mx-auto" id="snake-game-container">
      {/* Game Header */}
      <div className="flex justify-between items-center w-full mb-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Award className="text-amber-400 w-5 h-5" />
          <span className="font-mono text-zinc-400 text-sm">HIGH: {highScore}</span>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold font-mono tracking-wider text-green-400">{score}</span>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Score</p>
        </div>
        <button
          onClick={() => setSound(!sound)}
          className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition"
          title="Toggle Sound"
        >
          {sound ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-zinc-600" />}
        </button>
      </div>

      {/* Game Board */}
      <div
        ref={boardRef}
        className="relative bg-zinc-950 aspect-square w-full rounded-lg border border-zinc-800 overflow-hidden flex flex-col justify-center items-center"
        style={{
          boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8)'
        }}
      >
        {/* Render grid pixels */}
        {!isStarted ? (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Play className="text-emerald-400 w-8 h-8 translate-x-0.5" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-1 font-mono">Retro Arcade Snake</h3>
            <p className="text-xs text-zinc-400 max-w-[280px] mb-6 font-sans">
              Use your keyboard arrow keys or WASD to navigate. Eat food to grow!
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
            >
              START GAME
            </button>
          </div>
        ) : null}

        {isGameOver ? (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <span className="text-red-500 font-mono font-bold text-3xl mb-1 tracking-widest animate-bounce">
              GAME OVER
            </span>
            <p className="text-sm text-zinc-400 mb-6 font-mono">You scored {score} points!</p>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold font-mono rounded-lg border border-zinc-700 transition hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> PLAY AGAIN
            </button>
          </div>
        ) : null}

        {/* Snake & Food Grid items */}
        {isStarted && !isGameOver && (
          <div className="w-full h-full p-0.5 relative" style={{ display: 'grid', gridTemplateColumns: 'repeat(20, minmax(0, 1fr))', gridTemplateRows: 'repeat(20, minmax(0, 1fr))' }}>
            {/* Draw Food segment */}
            <div
              className="absolute bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              style={{
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                left: `${(food.x / GRID_SIZE) * 100}%`,
                top: `${(food.y / GRID_SIZE) * 100}%`,
                padding: '1.5px',
              }}
            >
              <div className="w-full h-full bg-rose-300 rounded-full" />
            </div>

            {/* Draw Snake segments */}
            {snake.map((seg, idx) => {
              const isHead = idx === 0;
              return (
                <div
                  key={idx}
                  className="absolute"
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(seg.x / GRID_SIZE) * 100}%`,
                    top: `${(seg.y / GRID_SIZE) * 100}%`,
                    padding: '1px',
                    transition: 'left 150ms linear, top 150ms linear',
                  }}
                >
                  <div
                    className={`w-full h-full rounded ${
                      isHead
                        ? 'bg-emerald-400 border border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                        : 'bg-emerald-600 border border-emerald-500 opacity-90'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* On Screen Controls for Touch and Accessibility */}
      <div className="flex flex-col items-center gap-1 mt-6 w-full max-w-[200px] select-none">
        <button
          onClick={() => direction !== 'DOWN' && setDirection('UP')}
          className="w-12 h-12 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 active:bg-zinc-600 rounded-xl text-zinc-200 shadow-md transition"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex gap-10">
          <button
            onClick={() => direction !== 'RIGHT' && setDirection('LEFT')}
            className="w-12 h-12 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 active:bg-zinc-600 rounded-xl text-zinc-200 shadow-md transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => direction !== 'LEFT' && setDirection('RIGHT')}
            className="w-12 h-12 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 active:bg-zinc-600 rounded-xl text-zinc-200 shadow-md transition"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => direction !== 'UP' && setDirection('DOWN')}
          className="w-12 h-12 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 active:bg-zinc-600 rounded-xl text-zinc-200 shadow-md transition"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      <div className="text-zinc-500 text-[10px] text-center mt-4 font-mono">
        TIP: Use WASD/Arrow keys. Game pauses when tab is closed.
      </div>
    </div>
  );
}
