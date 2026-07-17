import React, { useState, useEffect, useRef } from 'react';
import { Rocket, RotateCcw, Compass, Award, Play } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export default function CosmicLander() {
  const [isStarted, setIsStarted] = useState(false);
  const [gameState, setGameState] = useState<'PLAYING' | 'CRASHED' | 'LANDED'>('PLAYING');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('unblocked_lander_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics state (using refs for the game loop to avoid React render delays)
  const xRef = useRef(150);
  const yRef = useRef(50);
  const vxRef = useRef(1.0);
  const vyRef = useRef(0.0);
  const angleRef = useRef(0); // in radians
  const fuelRef = useRef(500); // start fuel
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const particlesRef = useRef<Particle[]>([]);

  // Terrain generation
  const terrainRef = useRef<Array<{ x: number; y: number; isPlatform?: boolean }>>([]);

  const initGame = () => {
    // Canvas dimensions: 400x300
    xRef.current = 80 + Math.random() * 80;
    yRef.current = 40;
    vxRef.current = 0.5 + Math.random() * 0.8;
    vyRef.current = 0;
    angleRef.current = 0;
    fuelRef.current = 500;
    particlesRef.current = [];
    setGameState('PLAYING');
    setIsStarted(true);

    // Generate terrain
    const points = [];
    points.push({ x: 0, y: 250 });
    points.push({ x: 80, y: 240 });
    points.push({ x: 150, y: 280 });
    // Landing pad 1
    points.push({ x: 180, y: 260, isPlatform: true });
    points.push({ x: 230, y: 260, isPlatform: true });
    points.push({ x: 280, y: 290 });
    points.push({ x: 330, y: 250 });
    // Landing pad 2
    points.push({ x: 340, y: 230, isPlatform: true });
    points.push({ x: 380, y: 230, isPlatform: true });
    points.push({ x: 400, y: 260 });

    terrainRef.current = points;
  };

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault(); // prevent scrolling
      }
      keysRef.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main canvas animation loop
  useEffect(() => {
    if (!isStarted) return;

    let animFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      updatePhysics();
      render(ctx);
      if (gameState === 'PLAYING') {
        animFrameId = requestAnimationFrame(gameLoop);
      }
    };

    animFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [isStarted, gameState]);

  const createExplosion = (x: number, y: number) => {
    const colors = ['#f43f5e', '#fb923c', '#fbbf24', '#ffffff', '#71717a'];
    for (let i = 0; i < 40; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 30 + Math.random() * 30,
      });
    }
  };

  const createThrustSparks = (x: number, y: number, angle: number) => {
    // Expel sparks in opposite direction of angle
    const sparkAngle = angle + Math.PI + (Math.random() - 0.5) * 0.4;
    const speed = 2 + Math.random() * 3;
    particlesRef.current.push({
      x,
      y,
      vx: Math.sin(sparkAngle) * speed + (Math.random() - 0.5) * 0.5,
      vy: -Math.cos(sparkAngle) * speed + (Math.random() - 0.5) * 0.5,
      color: Math.random() > 0.4 ? '#fb923c' : '#fbbf24',
      life: 10 + Math.random() * 10,
    });
  };

  const updatePhysics = () => {
    if (gameState !== 'PLAYING') return;

    // Apply rotation
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
      angleRef.current -= 0.05;
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
      angleRef.current += 0.05;
    }

    // Apply thrust
    let isThrusting = false;
    if ((keysRef.current['ArrowUp'] || keysRef.current['KeyW'] || keysRef.current['Space']) && fuelRef.current > 0) {
      isThrusting = true;
      fuelRef.current = Math.max(0, fuelRef.current - 1.5);

      // Force vectors
      const thrust = 0.04;
      vxRef.current += Math.sin(angleRef.current) * thrust;
      vyRef.current -= Math.cos(angleRef.current) * thrust;

      // Create spark particles at back nozzle
      const backX = xRef.current - Math.sin(angleRef.current) * 10;
      const backY = yRef.current + Math.cos(angleRef.current) * 10;
      createThrustSparks(backX, backY, angleRef.current);
    }

    // Apply gravity
    vyRef.current += 0.015;

    // Apply velocities
    xRef.current += vxRef.current;
    yRef.current += vyRef.current;

    // Screen boundaries wrapping or crashing
    if (xRef.current < 0) xRef.current = 400;
    if (xRef.current > 400) xRef.current = 0;

    // Particle decay
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // Collision detection with terrain
    checkCollisions();
  };

  const checkCollisions = () => {
    const px = xRef.current;
    const py = yRef.current;

    // Find the terrain segment the lander is currently over
    const points = terrainRef.current;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if (px >= p1.x && px <= p2.x) {
        // Interpolate terrain height at lander's exact X position
        const ratio = (px - p1.x) / (p2.x - p1.x);
        const terrainY = p1.y + ratio * (p2.y - p1.y);

        // Lander landed/crashed if it goes below the terrain line
        if (py + 8 >= terrainY) {
          yRef.current = terrainY - 8; // Rest on terrain

          // Verify if it is on a safe landing platform
          const isOnPlatform = p1.isPlatform && p2.isPlatform;

          // Check landing velocity and rotation criteria
          const speedOk = Math.abs(vyRef.current) < 1.2 && Math.abs(vxRef.current) < 0.8;
          const angleOk = Math.abs(angleRef.current) < 0.15; // close to 90 degrees/flat

          if (isOnPlatform && speedOk && angleOk) {
            setGameState('LANDED');
            const bonus = Math.floor(fuelRef.current / 5);
            const addedScore = 100 + bonus;
            setScore(prev => {
              const next = prev + addedScore;
              if (next > highScore) {
                setHighScore(next);
                localStorage.setItem('unblocked_lander_high_score', next.toString());
              }
              return next;
            });
          } else {
            setGameState('CRASHED');
            createExplosion(px, py);
            setScore(0); // Reset streak on crash
          }
          break;
        }
      }
    }
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    // Clear Canvas
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 400, 300);

    // Draw stars/space environment
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 20; i++) {
      const starX = (i * 37) % 400;
      const starY = (i * 19) % 240;
      ctx.fillRect(starX, starY, 1.5, 1.5);
    }

    // Draw particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 60;
      ctx.fillRect(p.x, p.y, 2.5, 2.5);
    });
    ctx.globalAlpha = 1.0;

    // Draw terrain
    const points = terrainRef.current;
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(400, 300);
      ctx.lineTo(0, 300);
      ctx.closePath();

      // Earthy dark lunar soil
      ctx.fillStyle = '#27272a';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#52525b';
      ctx.stroke();

      // Highlight platform landing zones with neon green glowing lines
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (p1.isPlatform && p2.isPlatform) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Text marker
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('LANDING ZONE', p1.x + 2, p1.y - 6);
        }
      }
    }

    // Draw Lander Spacecraft
    if (gameState === 'PLAYING' || gameState === 'LANDED') {
      ctx.save();
      ctx.translate(xRef.current, yRef.current);
      ctx.rotate(angleRef.current);

      // Spaceship Cabin (White capsule)
      ctx.fillStyle = '#f4f4f5';
      ctx.beginPath();
      ctx.arc(0, -2, 6, 0, Math.PI * 2);
      ctx.fill();

      // Cockpit window
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(2, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Metal Landing Gear legs
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // left leg
      ctx.moveTo(-4, 2);
      ctx.lineTo(-7, 8);
      ctx.lineTo(-9, 8);
      // right leg
      ctx.moveTo(4, 2);
      ctx.lineTo(7, 8);
      ctx.lineTo(9, 8);
      ctx.stroke();

      // Back engine nozzle
      ctx.fillStyle = '#71717a';
      ctx.fillRect(-2, 3, 4, 3);

      ctx.restore();
    }
  };

  return (
    <div className="flex flex-col items-center bg-[#18181b] p-6 rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-lg mx-auto">
      {/* Lander Header Stats */}
      <div className="flex justify-between items-center w-full mb-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          <Award className="w-4 h-4 text-amber-400" />
          <span>STREAK: {score}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>BEST: {highScore}</span>
        </div>
      </div>

      {/* Physics Canvas Area */}
      <div className="relative bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-inner flex flex-col justify-center items-center">
        {!isStarted ? (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mb-4">
              <Rocket className="text-cyan-400 w-6 h-6 rotate-45" />
            </div>
            <h3 className="text-md font-bold text-zinc-100 mb-1 font-mono">Lunar Lander Physics</h3>
            <p className="text-xs text-zinc-400 max-w-[280px] mb-6 font-sans">
              Press W / UP / SPACE to thrust upwards. A/D / LEFT/RIGHT to tilt and rotate. Land gently!
            </p>
            <button
              onClick={initGame}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold font-mono rounded-lg transition hover:scale-105"
            >
              LAUNCH VESSEL
            </button>
          </div>
        ) : null}

        {gameState === 'CRASHED' ? (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <span className="text-red-500 font-mono font-bold text-2xl mb-1 tracking-widest animate-pulse">
              VESSEL DESTROYED
            </span>
            <p className="text-xs text-zinc-400 mb-5 max-w-xs font-sans">
              Impact speed was too severe or landing angle was misaligned. Spacecraft exploded!
            </p>
            <button
              onClick={initGame}
              className="flex items-center gap-2 px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold font-mono rounded-lg transition border border-zinc-700"
            >
              <RotateCcw className="w-4 h-4" /> RE-LAUNCH
            </button>
          </div>
        ) : null}

        {gameState === 'LANDED' ? (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <span className="text-emerald-400 font-mono font-bold text-2xl mb-1 tracking-widest">
              PERFECT LANDING!
            </span>
            <p className="text-xs text-zinc-400 mb-5 font-mono">
              Mission accomplished. Score increased!
            </p>
            <button
              onClick={initGame}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono rounded-lg transition"
            >
              NEXT MISSION
            </button>
          </div>
        ) : null}

        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="block w-full h-auto"
          style={{
            maxWidth: '100%',
            aspectRatio: '4 / 3'
          }}
        />

        {/* Realtime fuel gage inside canvas overlay */}
        {isStarted && gameState === 'PLAYING' && (
          <div className="absolute bottom-3 left-3 bg-zinc-900/90 border border-zinc-800 p-2 rounded text-[10px] font-mono text-zinc-300 w-32 flex flex-col gap-1 select-none">
            <div className="flex justify-between">
              <span>FUEL:</span>
              <span className={fuelRef.current < 150 ? 'text-red-400 font-bold animate-pulse' : 'text-zinc-200'}>
                {Math.ceil(fuelRef.current)}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  fuelRef.current < 150 ? 'bg-red-500' : 'bg-cyan-400'
                }`}
                style={{ width: `${(fuelRef.current / 500) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="text-zinc-500 text-[10px] text-center mt-4 font-mono">
        MISSION CRITERIA: Angle close to 0°, low horizontal/vertical descent speed.
      </div>
    </div>
  );
}
