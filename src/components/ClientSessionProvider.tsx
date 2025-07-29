'use client';

import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js'; 
import { createClient } from '@/lib/supabase';

// Define the shape of the auth context
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ user: null, error: new Error('Not implemented') }),
  signUp: async () => ({ user: null, error: new Error('Not implemented') }),
  signOut: async () => {},
});

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

// List of routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/', '/about'];

export function ClientSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  // Flag to track if user just completed authentication
  const justAuthenticated = useRef(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use the new browser client
  const supabase = createClient();

  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname || '');

  // Check URL for any auth-related parameters
  useEffect(() => {
    // Check if we have code in the URL (from auth callback)
    const hasAuthCode = searchParams?.has('code');
    
    if (hasAuthCode) {
      console.log('[Auth] Auth code detected in URL, setting justAuthenticated flag');
      justAuthenticated.current = true;
    }
  }, [searchParams]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      console.log('[Auth] Initializing auth state...');
      try {
        // Fetch session from API endpoint to ensure server-client consistency
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();
        if (sessionData.error) {
          console.error('[Auth] Session API error:', sessionData.error);
          setSession(null);
          setUser(null);
        } else {
          setSession(null); // SSR session API does not return a session object, just user
          setUser(sessionData.user);
          // Store role in localStorage if available
          if (sessionData.user?.user_metadata?.role) {
            localStorage.setItem('userRole', sessionData.user.user_metadata.role);
          }
        }
      } catch (error) {
        console.error('[Auth] Auth initialization error:', error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };
    initAuth();
  }, []);

  // Handle redirects based on auth state
  useEffect(() => {
    if (!isLoading && initialized) {
      if (!user && !isPublicRoute && !justAuthenticated.current) {
        router.push(`/login?redirectTo=${encodeURIComponent(pathname || '/dashboard')}`);
      } else if (user && justAuthenticated.current) {
        justAuthenticated.current = false;
      }
    }
  }, [user, isLoading, pathname, router, isPublicRoute, initialized]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (data.user) {
        justAuthenticated.current = true;
        setUser(data.user);
        setSession(data.session);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
          window.location.href = redirectTo;
        }
        return { user: data.user, error: null };
      }
      return { user: data.user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  };

  // Sign up new user
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        justAuthenticated.current = true;
        return {
          user: data.user,
          error: null
        };
      }
      return {
        user: null,
        error: null
      };
    } catch (error: any) {
      return {
        user: null,
        error: error
      };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userRole');
      setUser(null);
      setSession(null);
      router.push('/login');
    } catch (error) {
      router.push('/login');
    }
  };

  // Value object for the context provider
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
