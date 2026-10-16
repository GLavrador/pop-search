import { createContext, useContext } from 'react';

interface StatusContextType {
  status: string | null;
  setStatus: (message: string, duration?: number) => void;
}

export const StatusContext = createContext<StatusContextType | undefined>(undefined);

export const useStatus = () => {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};
