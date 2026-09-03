import { createContext, useContext } from 'react';
import type { TourFrame } from '../constants/tourScript';

export interface TourContextType {
  active: boolean;
  frame: TourFrame | null;
  cursor: number;
  total: number;
  isLast: boolean;
  start: () => void;
  stop: () => void;
  next: () => void;
  back: () => void;
}

export const TourContext = createContext<TourContextType>({
  active: false,
  frame: null,
  cursor: 0,
  total: 0,
  isLast: false,
  start: () => {},
  stop: () => {},
  next: () => {},
  back: () => {},
});

export const useTour = () => useContext(TourContext);
