import { DinoView } from './DinoView';
import { FlappyView } from './FlappyView';
import { DINO, createDino, stepDino, type DinoState } from './dino';
import { FLAPPY, createFlappy, stepFlappy, type FlappyState } from './flappy';
import type { Cartridge } from './index';

export const FLAPPY_GAME: Cartridge<FlappyState> = {
  goal: FLAPPY.goal,
  ducks: false,
  create: createFlappy,
  step: stepFlappy,
  View: FlappyView,
};

export const DINO_GAME: Cartridge<DinoState> = {
  goal: DINO.goal,
  ducks: true,
  create: createDino,
  step: stepDino,
  View: DinoView,
};

/** How many points set the icons free, at each game. */
export const GOALS = { flappy: FLAPPY.goal, dino: DINO.goal } as const;
