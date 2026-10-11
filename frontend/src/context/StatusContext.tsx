import { createContext, useContext, useState, useRef, useEffect, useMemo, type ReactNode, useCallback } from 'react';
import { StatusFactsContext, type StatusFact, type StatusScope } from './statusFacts';

interface StatusContextType {
  status: string | null;
  setStatus: (message: string, duration?: number) => void;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export const StatusProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatusState] = useState<string | null>(null);
  const [facts, setFacts] = useState<Partial<Record<StatusScope, readonly StatusFact[]>>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const setStatus = useCallback((message: string, duration?: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setStatusState(message);
    
    if (duration) {
      timeoutRef.current = setTimeout(() => {
        setStatusState(null);
        timeoutRef.current = null;
      }, duration);
    }
  }, []);

  const post = useCallback((scope: StatusScope, next: readonly StatusFact[] | null) => {
    setFacts((current) => ({ ...current, [scope]: next ?? undefined }));
  }, []);

  const posted = useMemo(() => ({ facts, post }), [facts, post]);

  return (
    <StatusContext.Provider value={{ status, setStatus }}>
      <StatusFactsContext.Provider value={posted}>{children}</StatusFactsContext.Provider>
    </StatusContext.Provider>
  );
};

export const useStatus = () => {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};