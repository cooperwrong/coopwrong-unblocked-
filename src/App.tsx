import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  Search,
  ExternalLink,
  FileCode,
  Info,
  ChevronRight,
  Sparkles,
  Globe,
  RefreshCw,
  SlidersHorizontal,
  Terminal,
  Copy,
  Check,
  ArrowLeft,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Download
} from 'lucide-react';
import { Game, TabType } from './types';
import { developerCode } from './developerCode';
import RetroSnake from './components/RetroSnake';
import SpaceClicker from './components/SpaceClicker';
import CosmicLander from './components/CosmicLander';
import Classic2048 from './components/Classic2048';
import BrickBreaker from './components/BrickBreaker';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Popular');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('play');
  
  // Developer Code Viewer State
  const [selectedFile, setSelectedFile] = useState<'gamesJson' | 'indexHtml' | 'styleCss' | 'scriptJs'>('indexHtml');
  const [copiedFile, setCopiedFile] = useState(false);

  // Dynamic players counter
  const [activePlayers, setActivePlayers] = useState(342);

  // Randomize active players slightly over time for realism
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlayers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load games from games.json
  useEffect(() => {
    async function loadGames() {
      try {
        const response = await fetch('games.json');
        if (response.ok) {
          const data = await response.json();
          setGames(data);
        } else {
          console.error("Failed to fetch games.json");
        }
      } catch (err) {
        console.error("Error loading games.json:", err);
      }
    }
    loadGames();
  }, []);

  const handleCopyCode = () => {
    let textToCopy = '';
    switch (selectedFile) {
      case 'gamesJson': textToCopy = developerCode.gamesJson; break;
      case 'indexHtml': textToCopy = developerCode.indexHtml; break;
      case 'styleCss': textToCopy = developerCode.styleCss; break;
      case 'scriptJs': textToCopy = developerCode.scriptJs; break;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const categories = ['Popular', 'Retro', 'Puzzle', 'Clicker', 'Physics', 'All'];

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (activeCategory === 'Popular') {
      matchesCategory = true; // Show all on popular tab by default
    } else if (activeCategory === 'Retro') {
      matchesCategory = game.category === 'Built-in Retro' || game.tags.some(t => t.toLowerCase() === 'retro');
    } else if (activeCategory === 'Puzzle') {
      matchesCategory = game.tags.some(t => t.toLowerCase() === 'puzzle');
    } else if (activeCategory === 'Clicker') {
      matchesCategory = game.tags.some(t => t.toLowerCase() === 'clicker');
    } else if (activeCategory === 'Physics') {
      matchesCategory = game.tags.some(t => t.toLowerCase() === 'physics');
    } else if (activeCategory === 'All') {
      matchesCategory = true;
    }
    return matchesSearch && matchesCategory;
  });

  // Featured Game of the Day
  const featuredGame = games.find(g => g.id === 'snake-local') || games[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-zinc-100 font-sans select-none selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background radial overlays */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-indigo-950/15 via-[#0c0c0e]/10 to-transparent pointer-events-none z-0" />
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Navigation Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-800 bg-[#0c0c0e] shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveGame(null); setActiveTab('play'); }}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(79,70,229,0.4)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <path d="M6 12h4"/>
              <path d="M8 10v4"/>
              <circle cx="15" cy="11" r="1"/>
              <circle cx="18" cy="13" r="1"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            NEON<span className="text-indigo-500">HUB</span>
          </span>
        </div>

        {/* Global Search bar inside header when Play tab is active */}
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          {activeTab === 'play' && !activeGame && (
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none opacity-40">
                <Search className="w-4 h-4 text-zinc-400" />
              </div>
              <input
                type="text"
                placeholder="Search unblocked games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-1.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setActiveTab('developer'); setActiveGame(null); }}
            className={`text-xs font-semibold uppercase tracking-widest transition-colors cursor-pointer ${
              activeTab === 'developer' ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Exporter
          </button>
          <div className="h-4 w-px bg-zinc-800"></div>
          <button
            onClick={() => { setActiveTab('about'); setActiveGame(null); }}
            className={`text-xs font-semibold uppercase tracking-widest transition-colors cursor-pointer ${
              activeTab === 'about' ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            About
          </button>
          <div className="h-4 w-px bg-zinc-800"></div>
          <button
            onClick={() => { setActiveTab('play'); setActiveGame(null); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'play'
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.3)]'
                : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            Arcade Play
          </button>
        </div>
      </header>

      {/* Sub Header Category Navigation Bar when on Games Tab */}
      {activeTab === 'play' && !activeGame && (
        <nav className="h-12 flex items-center px-8 gap-6 border-b border-zinc-800 bg-[#09090b] shrink-0 overflow-x-auto select-none no-scrollbar z-35 sticky top-16">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-bold uppercase tracking-wider h-full flex items-center px-1 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'text-indigo-400 border-indigo-500'
                  : 'text-zinc-500 hover:text-zinc-300 border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-8 bg-gradient-to-b from-[#0c0c0e] to-[#09090b] z-10 relative">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PLAYABLE ARCADE HUB */}
          {activeTab === 'play' && !activeGame && (
            <motion.div
              key="arcade-list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8 max-w-7xl mx-auto"
            >
              {/* Mobile-only Search input */}
              <div className="block md:hidden">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none opacity-40">
                    <Search className="w-4 h-4 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search unblocked games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-1.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Featured game block */}
              {featuredGame && !searchQuery && activeCategory === 'Popular' && (
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0e] flex flex-col md:flex-row h-auto md:h-72 shadow-2xl">
                  {/* Decorative ambient gradient */}
                  <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
                  
                  <div className="md:w-1/2 relative h-44 md:h-auto overflow-hidden border-r border-zinc-800/40">
                    <img
                      src={featuredGame.thumbnail}
                      alt={featuredGame.title}
                      className="w-full h-full object-cover transform hover:scale-102 transition duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-indigo-600 rounded text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 shadow-md">
                      ★ Featured Arcade
                    </div>
                  </div>

                  <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between items-start gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1.5">
                        {featuredGame.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-mono font-bold bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-xl md:text-2xl font-black font-mono text-zinc-100 tracking-tight">
                        {featuredGame.title}
                      </h2>
                      <p className="text-zinc-400 text-xs leading-relaxed max-w-md">
                        {featuredGame.description}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveGame(featuredGame)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs tracking-wider rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      PLAY RETRO SNAKE
                    </button>
                  </div>
                </div>
              )}

              {/* Interactive Game List Grid */}
              {filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredGames.map(game => (
                    <motion.div
                      key={game.id}
                      onClick={() => setActiveGame(game)}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col group cursor-pointer"
                    >
                      {/* Image Thumbnail Stage */}
                      <div className="aspect-video bg-zinc-800 rounded-xl overflow-hidden relative border border-zinc-700/50 group-hover:border-indigo-500/50 transition-all shadow-lg">
                        <img
                          src={game.thumbnail}
                          alt={game.title}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/5 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        
                        {/* Dynamic tag badges */}
                        <div className="absolute top-2.5 left-2.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border bg-zinc-950/80 backdrop-blur border-indigo-500/20 text-indigo-400">
                          {game.category}
                        </div>
                      </div>

                      {/* Text Description Segment */}
                      <div className="mt-3">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm">
                            {game.title}
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          {game.tags.slice(0, 2).join(' • ')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <Gamepad2 className="w-12 h-12 text-zinc-700 mx-auto mb-3 animate-bounce" />
                  <h3 className="text-zinc-400 font-mono font-semibold">No Games Match Search Filters</h3>
                  <p className="text-zinc-600 text-xs mt-1">Try resetting your filters or clearing your text query.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: ACTIVE GAME PLAYER VIEW */}
          {activeTab === 'play' && activeGame && (
            <motion.div
              key="arcade-player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6 max-w-5xl mx-auto"
            >
              {/* Back navigation bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0c0c0e] p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveGame(null)}
                    className="p-1.5 hover:bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition flex items-center gap-1 text-xs font-mono cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Home
                  </button>
                  <span className="text-zinc-600">/</span>
                  <span className="font-mono text-xs text-zinc-400 font-bold uppercase">{activeGame.title}</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {activeGame.url.startsWith('http') && (
                    <button
                      onClick={() => {
                        const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
                        if (iframe) iframe.src = iframe.src;
                      }}
                      className="w-full sm:w-auto px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs rounded-lg border border-zinc-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Restart Embed
                    </button>
                  )}
                  <button
                    onClick={() => setActiveGame(null)}
                    className="w-full sm:w-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs rounded-lg shadow-md transition cursor-pointer"
                  >
                    Exit Arcade
                  </button>
                </div>
              </div>

              {/* Player Stage Screen */}
              <div className="bg-[#0c0c0e] rounded-2xl border border-zinc-800 p-2 md:p-4 shadow-2xl relative flex flex-col justify-center items-center min-h-[420px]">
                
                {/* Local Games Loader */}
                {activeGame.url === 'local-snake' && <RetroSnake />}
                {activeGame.url === 'local-clicker' && <SpaceClicker />}
                {activeGame.url === 'local-lander' && <CosmicLander />}
                {activeGame.url === 'local-2048' && <Classic2048 />}
                {activeGame.url === 'local-breaker' && <BrickBreaker />}

                {/* External Iframe Loader */}
                {activeGame.url.startsWith('http') && (
                  <div className="w-full h-[75vh] min-h-[480px] rounded-lg overflow-hidden border border-zinc-800 bg-white relative">
                    <iframe
                      id="game-iframe"
                      src={activeGame.url}
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; encrypted-media; fullscreen"
                      referrerPolicy="no-referrer"
                      className="w-full h-full block"
                    />
                  </div>
                )}
              </div>

              {/* Interactive Game Specs */}
              <div className="bg-[#0c0c0e] p-6 rounded-xl border border-zinc-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <span className="text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-indigo-400 px-2 py-0.5 rounded">
                      {activeGame.category}
                    </span>
                    {activeGame.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-mono text-zinc-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-bold font-mono text-zinc-200 mt-1">{activeGame.title}</h3>
                  <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed">
                    {activeGame.description}
                  </p>
                </div>

                {activeGame.url.startsWith('http') && (
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl max-w-xs text-[10px] font-mono text-zinc-500 leading-normal">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-zinc-300 font-bold">Unblocked Embed Guard:</span> If this iframe is blank, your school or work router blocks this domain. Try playing one of our built-in offline games!
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: SOURCE EXPORTER / DEVELOPER MODE */}
          {activeTab === 'developer' && (
            <motion.div
              key="developer-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-6 max-w-6xl mx-auto"
            >
              {/* Header card */}
              <div className="bg-[#0c0c0e] p-6 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                  <Terminal className="w-4 h-4" /> Export Complete Static Source Code
                </div>
                <h2 className="text-xl font-bold text-zinc-100 font-mono">Download Your Unblocked Game Site</h2>
                <p className="text-zinc-400 text-xs leading-relaxed mt-1 max-w-3xl">
                  As requested in your guide, you can build your own static unblocked game portal by placing four files in the same directory: <code className="text-indigo-400 font-bold font-mono">index.html</code>, <code className="text-indigo-400 font-bold font-mono">style.css</code>, <code className="text-indigo-400 font-bold font-mono">script.js</code>, and <code className="text-indigo-400 font-bold font-mono">games.json</code>. Toggle through the files below and copy or download them to start hosting!
                </p>
              </div>

              {/* Code Panel Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Left side checklist */}
                <div className="lg:col-span-1 flex flex-col gap-2">
                  <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase px-2 mb-1">Source Files</div>
                  
                  <button
                    onClick={() => setSelectedFile('indexHtml')}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition ${
                      selectedFile === 'indexHtml'
                        ? 'bg-zinc-900 border-indigo-500/30 text-indigo-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-orange-400" />
                      <span className="font-mono text-xs">index.html</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedFile('styleCss')}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition ${
                      selectedFile === 'styleCss'
                        ? 'bg-zinc-900 border-indigo-500/30 text-indigo-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-cyan-400" />
                      <span className="font-mono text-xs">style.css</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedFile('scriptJs')}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition ${
                      selectedFile === 'scriptJs'
                        ? 'bg-zinc-900 border-indigo-500/30 text-indigo-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-yellow-400" />
                      <span className="font-mono text-xs">script.js</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedFile('gamesJson')}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition ${
                      selectedFile === 'gamesJson'
                        ? 'bg-zinc-900 border-indigo-500/30 text-indigo-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-xs">games.json</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="mt-4 p-4 bg-indigo-950/10 border border-indigo-500/10 rounded-xl space-y-2">
                    <h4 className="font-bold text-xs text-indigo-300 font-mono">Quick-Start Guide</h4>
                    <ul className="text-[10px] text-zinc-400 space-y-1.5 list-decimal pl-4 leading-normal">
                      <li>Copy the content of all 4 files into a local folder.</li>
                      <li>Name each file exactly as shown.</li>
                      <li>Double-click the <code className="text-zinc-300 bg-zinc-900 px-1 rounded font-bold">index.html</code> file or host it on GitHub Pages.</li>
                    </ul>
                  </div>
                </div>

                {/* Code Window Display */}
                <div className="lg:col-span-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col justify-between overflow-hidden shadow-xl min-h-[450px]">
                  
                  {/* Window Bar Header */}
                  <div className="bg-zinc-900 px-4 py-2.5 flex justify-between items-center border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 ml-2">
                        {selectedFile === 'gamesJson' && 'games.json'}
                        {selectedFile === 'indexHtml' && 'index.html'}
                        {selectedFile === 'styleCss' && 'style.css'}
                        {selectedFile === 'scriptJs' && 'script.js'}
                      </span>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded text-zinc-300 flex items-center gap-1 transition cursor-pointer animate-pulse"
                    >
                      {copiedFile ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Code
                        </>
                      )}
                    </button>
                  </div>

                  {/* Pre/Code box */}
                  <div className="flex-1 overflow-auto p-4 max-h-[380px]">
                    <pre className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre select-all">
                      <code>
                        {selectedFile === 'gamesJson' && developerCode.gamesJson}
                        {selectedFile === 'indexHtml' && developerCode.indexHtml}
                        {selectedFile === 'styleCss' && developerCode.styleCss}
                        {selectedFile === 'scriptJs' && developerCode.scriptJs}
                      </code>
                    </pre>
                  </div>

                  {/* Download banner footer */}
                  <div className="p-3 bg-zinc-900 border-t border-zinc-800/80 flex justify-between items-center text-[10px] font-mono text-zinc-500">
                    <span>File size: ~2.4 KB (Estimated)</span>
                    <span>Ready for local offline deployment</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: ABOUT PAGE */}
          {activeTab === 'about' && (
            <motion.div
              key="about-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="bg-[#0c0c0e] p-6 rounded-xl border border-zinc-800">
                <h2 className="text-xl font-bold font-mono text-zinc-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" /> Understanding Unblocked Game Sites
                </h2>
                <div className="text-zinc-400 text-xs leading-relaxed space-y-4 mt-3">
                  <p>
                    <strong>What is an "Unblocked" game?</strong>
                    <br />
                    Schools and workplaces implement firewall filters that block popular gaming websites. "Unblocked" websites bypass these filters by using domain names that are categorized under "Utility," "Education," or "Software," or by embedding the gaming applications through proxies and iframes.
                  </p>
                  <p>
                    <strong>Why did we include built-in games?</strong>
                    <br />
                    Many unblocked games rely on embedded iframes, but modern browsers enforce strict security rules like <code className="text-indigo-300">CORS</code>, <code className="text-indigo-300">Same-Origin Policy</code>, and <code className="text-indigo-300">X-Frame-Options: DENY</code>. This means several websites block embedding inside other platforms. To make sure you ALWAYS have fully working, lag-free games, we built high-quality retro games directly in React so you are 100% immune to proxy blocking!
                  </p>
                  <p>
                    <strong>How to easily host your own unblocked games hub:</strong>
                    <br />
                    Deploying a static unblocked games hub is completely free and takes 5 minutes!
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>
                      <strong>GitHub Pages:</strong> Create a new repository on GitHub, upload the 4 files from the Source Exporter tab, and enable GitHub Pages in Settings.
                    </li>
                    <li>
                      <strong>Vercel / Netlify:</strong> Simply drag and drop the folder containing your 4 files to Netlify Drop or connect your GitHub.
                    </li>
                    <li>
                      <strong>Local Server:</strong> Run a python server locally with <code className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded font-mono">python -m http.server 8000</code> or use VS Code's Live Server extension.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-[#0c0c0e] p-6 rounded-xl border border-zinc-800 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-200 font-mono">Need more games?</h4>
                  <p className="text-zinc-500 text-xs leading-normal mt-0.5">
                    Open <code className="text-indigo-300 font-mono">games.json</code>, find unblocked embeds (such as those hosted on itch.io or Google logo archives), copy the URL, and paste it to instantly expand your arcade library.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Styled Footer */}
      <footer className="h-10 flex items-center justify-between px-8 border-t border-zinc-800 bg-[#0c0c0e] shrink-0 text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-auto">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>{activePlayers} Active Players Online</span>
        </div>
        <div className="flex gap-4">
          <span>System Status: Optimal</span>
          <span className="text-indigo-400 font-bold">• Proxy Active</span>
        </div>
      </footer>

    </div>
  );
}
