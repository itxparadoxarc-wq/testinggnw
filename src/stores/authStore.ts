import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

let authInitialized = false;

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  profile: any | null;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  init: () => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setAdmin: (isAdmin: boolean) => void;
  setProfile: (profile: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  profile: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setAdmin: (isAdmin) => set({ isAdmin }),
  setProfile: (profile) => set({ profile }),

  signUp: async (email, password, fullName) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
  },

  signIn: async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAdmin: false, profile: null });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    if (error) return { error };
    return { error: null };
  },

  init: () => {
    if (authInitialized) return;
    authInitialized = true;

    const checkAdmin = async (userId: string) => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      set({ isAdmin: !!data });
    };

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      set({ profile: data });
    };

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: true });
      if (session?.user) {
        setTimeout(() => {
          Promise.all([checkAdmin(session.user.id), fetchProfile(session.user.id)])
            .finally(() => set({ loading: false }));
        }, 0);
      } else {
        set({ isAdmin: false, profile: null, loading: false });
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        await Promise.all([checkAdmin(session.user.id), fetchProfile(session.user.id)]);
      } else {
        set({ isAdmin: false, profile: null });
      }
      set({ loading: false });
    });
  },
}));
