import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContext, type AuthContextType } from './authContext';

const toFriendlyError = (message: string): string => {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Wrong e-mail or password.';
  }
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'That e-mail already has an account. Try signing in.';
  }
  if (normalized.includes('password should be')) {
    return 'Password is too short. Use at least 6 characters.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Confirm your e-mail before signing in. Check your inbox.';
  }
  return message;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setIsLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    session,
    displayName:
      (session?.user.user_metadata?.display_name as string | undefined) ??
      session?.user.email?.split('@')[0] ??
      null,
    isLoading,
    isAuthenticated: session !== null,

    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? toFriendlyError(error.message) : null };
    },

    signUp: async (email, password, displayName) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      return { error: error ? toFriendlyError(error.message) : null };
    },

    signOut: async () => {
      await supabase.auth.signOut();
    },
  }), [session, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
