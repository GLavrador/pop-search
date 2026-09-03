import { useEffect, useState } from 'react';
import { isDemoActive, setDemoActive, subscribeToDemo } from '../services/demoMode';

export const useDemoMode = () => {
  const [active, setActive] = useState(isDemoActive);

  useEffect(() => subscribeToDemo(setActive), []);

  return {
    active,
    start: () => setDemoActive(true),
    stop: () => setDemoActive(false),
  };
};
