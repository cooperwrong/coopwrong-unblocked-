import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Zap, ShoppingCart, Activity, ShieldAlert, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface UpgradeItem {
  id: string;
  name: string;
  cost: number;
  cps: number; // credits per second
  description: string;
  count: number;
  icon: React.ReactNode;
}

export default function SpaceClicker() {
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('unblocked_clicker_credits');
    return saved ? parseFloat(saved) : 0;
  });
  const [sound, setSound] = useState(true);
  const [cps, setCps] = useState(0);

  // Upgrade items state
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>(() => {
    const saved = localStorage.getItem('unblocked_clicker_upgrades');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map icons back to components
        return parsed.map((item: any) => ({
          ...item,
          icon: getIconForId(item.id),
        }));
      } catch (e) {
        // Fallback to default
      }
    }
    return [
      {
        id: 'miner',
        name: 'Quantum Miner',
        cost: 15,
        cps: 0.2,
        description: 'Automates stellar mining to extract helium-3 gas.',
        count: 0,
        icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      },
      {
        id: 'collector',
        name: 'Solar Array collector',
        cost: 100,
        cps: 1.5,
        description: 'Orbits stars to harvest raw thermonuclear radiation.',
        count: 0,
        icon: <Zap className="w-5 h-5 text-yellow-400" />,
      },
      {
        id: 'reactor',
        name: 'Fusion Reactor Grid',
        cost: 1100,
        cps: 12,
        description: 'Synthesizes clean subatomic hydrogen fuel structures.',
        count: 0,
        icon: <Activity className="w-5 h-5 text-teal-400" />,
      },
      {
        id: 'warp',
        name: 'Hyperspace Conduit',
        cost: 12000,
        cps: 115,
        description: 'Siphons dark energy from alternative dimensions.',
        count: 0,
        icon: <Sparkles className="w-5 h-5 text-fuchsia-400" />,
      },
    ];
  });

  // Helper to re-bind lucide icons after parsing JSON
  function getIconForId(id: string) {
    switch (id) {
      case 'miner': return <Cpu className="w-5 h-5 text-indigo-400" />;
      case 'collector': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'reactor': return <Activity className="w-5 h-5 text-teal-400" />;
      case 'warp': return <Sparkles className="w-5 h-5 text-fuchsia-400" />;
      default: return <Cpu className="w-5 h-5 text-zinc-400" />;
    }
  }

  const [clicks, setClicks] = useState<Array<{ id: number; x: number; y: number; val: number }>>([]);
  const clickIdRef = useRef(0);

  // Play retro audio beep
  const playBeep = (freq: number, type: OscillatorType, duration: number) => {
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
      // Audio context disabled
    }
  };

  // Game click handler
  const handleStarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const addedCredits = 1;
    setCredits(prev => prev + addedCredits);
    playBeep(440 + Math.random() * 200, 'sine', 0.08);

    // Add visual click point
    const id = clickIdRef.current++;
    setClicks(prev => [...prev, { id, x, y, val: addedCredits }]);

    // Remove particle after animation
    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== id));
    }, 800);
  };

  // Purchase upgrade
  const buyUpgrade = (id: string) => {
    const upgraded = upgrades.map(item => {
      if (item.id === id) {
        if (credits >= item.cost) {
          const newCredits = credits - item.cost;
          setCredits(newCredits);
          playBeep(659.25, 'triangle', 0.15); // E5 note
          const newCost = Math.round(item.cost * 1.15);
          return {
            ...item,
            count: item.count + 1,
            cost: newCost,
          };
        }
      }
      return item;
    });

    setUpgrades(upgraded);
  };

  // Reset progress
  const resetClicker = () => {
    if (confirm('Are you sure you want to reset your space colony?')) {
      setCredits(0);
      setUpgrades(prev => prev.map(item => ({ ...item, count: 0, cost: getBaseCost(item.id) })));
      playBeep(220, 'sawtooth', 0.5);
    }
  };

  function getBaseCost(id: string) {
    if (id === 'miner') return 15;
    if (id === 'collector') return 100;
    if (id === 'reactor') return 1100;
    return 12000;
  }

  // Calculate Credits Per Second (CPS)
  useEffect(() => {
    const totalCps = upgrades.reduce((acc, item) => acc + item.count * item.cps, 0);
    setCps(totalCps);
  }, [upgrades]);

  // Automated tick interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (cps > 0) {
        setCredits(prev => prev + (cps / 10));
      }
    }, 100); // Add CPS increment every 100ms for real-time fluid ticks

    return () => clearInterval(interval);
  }, [cps]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('unblocked_clicker_credits', credits.toString());
    // Store upgrade configurations without icon JSX elements
    const storableUpgrades = upgrades.map(({ icon, ...rest }) => rest);
    localStorage.setItem('unblocked_clicker_upgrades', JSON.stringify(storableUpgrades));
  }, [credits, upgrades]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-4xl mx-auto bg-[#18181b] p-6 rounded-2xl border border-zinc-800 shadow-2xl">
      {/* Clicker Area */}
      <div className="flex-1 flex flex-col items-center justify-between min-h-[350px] p-4 bg-zinc-950 rounded-xl border border-zinc-800 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/5 blur-3xl rounded-full" />

        {/* Top bar */}
        <div className="w-full flex justify-between items-center z-10">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
            <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>CPS: {cps.toFixed(1)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSound(!sound)}
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition"
              title="Toggle Sound"
            >
              {sound ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
            </button>
            <button
              onClick={resetClicker}
              className="text-[10px] text-zinc-500 hover:text-red-400 font-mono hover:underline px-1"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Score Display */}
        <div className="text-center my-4 z-10">
          <h2 className="text-4xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
            {Math.floor(credits).toLocaleString()}
          </h2>
          <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest mt-1">Cosmic Credits</p>
        </div>

        {/* Clicking Object (Neutron Star) */}
        <div className="relative my-8 cursor-pointer select-none" onClick={handleStarClick}>
          <div className="w-36 h-36 bg-gradient-to-tr from-cyan-500 via-purple-600 to-indigo-500 rounded-full flex items-center justify-center border-4 border-indigo-300 shadow-[0_0_40px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95 transition-all duration-75">
            <div className="w-28 h-28 bg-zinc-950 rounded-full flex items-center justify-center border-2 border-indigo-800/40">
              <Sparkles className="w-10 h-10 text-cyan-300 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
          </div>

          {/* Click particles */}
          {clicks.map(click => (
            <span
              key={click.id}
              className="absolute text-cyan-400 font-bold font-mono pointer-events-none select-none text-sm animate-fade-up-float"
              style={{
                left: click.x,
                top: click.y - 10,
                transform: 'translate(-50%, -50%)',
              }}
            >
              +{click.val}
            </span>
          ))}
        </div>

        {/* Bottom Tip */}
        <div className="text-[10px] font-mono text-zinc-600 z-10">
          Harvest nuclear energy to construct your celestial armada.
        </div>
      </div>

      {/* Upgrades panel */}
      <div className="w-full lg:w-80 flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <ShoppingCart className="w-4 h-4 text-purple-400" />
          <h3 className="font-mono text-sm font-semibold text-zinc-200">Orbital Shipyard Upgrades</h3>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px] pr-1">
          {upgrades.map(item => {
            const canAfford = credits >= item.cost;
            return (
              <button
                key={item.id}
                disabled={!canAfford}
                onClick={() => buyUpgrade(item.id)}
                className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  canAfford
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 cursor-pointer hover:border-purple-500/30 active:scale-[0.98]'
                    : 'bg-zinc-950/60 border-zinc-900/80 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className={`p-2 rounded-lg bg-zinc-950 ${canAfford ? 'border border-zinc-800' : 'border border-transparent'}`}>
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-zinc-200 text-xs truncate block">{item.name}</span>
                    <span className="text-[10px] font-mono bg-zinc-950 text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded ml-1 font-bold">
                      x{item.count}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">{item.description}</p>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">
                      ★ {item.cost.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      +{item.cps * 10 >= 1 ? `${(item.cps * 10).toFixed(0)}/10s` : `+${item.cps}/s`}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
