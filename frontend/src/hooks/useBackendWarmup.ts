import { useEffect } from 'react';
import { warmUpBackend } from '../services/api';

export const useBackendWarmup = () => {
  useEffect(() => {
    warmUpBackend();
  }, []);
};
