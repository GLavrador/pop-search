import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Arrival } from '../lib/arrival';

export interface AuthResult {
  error: string | null;
  /** The account was created and waits for its e-mail to be confirmed. */
  confirmEmail?: boolean;
}

export interface AuthContextType {
  session: Session | null;
  displayName: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Set when the page was opened from the link in a confirmation e-mail. */
  arrival: Arrival;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
