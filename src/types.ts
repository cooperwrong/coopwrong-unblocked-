export interface Game {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  description: string;
  category: string;
  tags: string[];
}

export type TabType = 'play' | 'developer' | 'about';

// Local Retro Snake Types
export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Clicker Game Types
export interface ClickerState {
  credits: number;
  multiplier: number;
  autoClickers: number;
  clickerCost: number;
  autoCost: number;
  quantumReactors: number;
  reactorCost: number;
}
