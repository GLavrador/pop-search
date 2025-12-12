import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';

interface StatusContextType {
  status: string;
  setStatus: (message: string, duration?: number) => void;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export const StatusProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatusState] = useState('Ready');

  const setStatus = useCallback((message: string, duration?: number) => {
    setStatusState(message);
    if (duration) {
      setTimeout(() => {
        setStatusState('Ready');
      }, duration);
    }
  }, []);

  return (
    <StatusContext.Provider value={{ status, setStatus }}>
      {children}
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