import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Role } from '../lib/types';
import { setAccessToken } from '../lib/authToken';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatar: string | null;
}

interface AuthState {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

// 🔥 SAFE profile loader (NUNCA rompe)
async function loadProfile(userId: string): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, avatar')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[auth] profile error:', error.message);
      return null;
    }

    if (!data) {
      console.warn('[auth] profile NOT FOUND');
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role as Role,
      avatar: data.avatar ?? null,
    };
  } catch (err) {
    console.error('[auth] profile exception:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const resolveSession = async (s: Session | null) => {
      if (!mounted) return;

      setSession(s);
      setAccessToken(s?.access_token ?? null);

      if (!s?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profile = await loadProfile(s.user.id);

      if (!mounted) return;

      // 🔥 incluso si profile es null, seguimos
      setUser(profile);
      setLoading(false);
    };

    // 🔥 solo UNA fuente de verdad
    supabase.auth.getSession().then(({ data }) => {
      resolveSession(data.session ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      resolveSession(s);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      loading,

      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return error ? { error: error.message } : {};
      },

      signOut: async () => {
        await supabase.auth.signOut();
        setAccessToken(null);
        setUser(null);
        setSession(null);
      },
    }),
    [session, user, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}