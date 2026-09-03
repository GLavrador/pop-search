import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'pop-search:assistant-dismissed';

// There is one assistant, rendered in more than one tab. Without a shared
// channel, dismissing it in one place would leave the other copy talking.
const listeners = new Set<(dismissed: boolean) => void>();

const read = (): boolean => {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};

const write = (dismissed: boolean) => {
  try {
    if (dismissed) {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } else {
      sessionStorage.removeItem(DISMISSED_KEY);
    }
  } catch {
    // A blocked storage only costs us the memory between reloads.
  }
};

export const useAssistantVisibility = () => {
  const [dismissed, setDismissed] = useState(read);

  useEffect(() => {
    listeners.add(setDismissed);
    return () => {
      listeners.delete(setDismissed);
    };
  }, []);

  const broadcast = (value: boolean) => {
    write(value);
    listeners.forEach((listener) => listener(value));
  };

  return {
    dismissed,
    dismiss: () => broadcast(true),
    restore: () => broadcast(false),
  };
};
