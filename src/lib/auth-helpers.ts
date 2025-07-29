import { createClient, createApiClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

/**
 * Get the current authenticated user from a request (API route)
 */
export async function getCurrentUser(req: NextRequest) {
  try {
    // Get the auth token from the request headers
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No auth token provided' };
    }
    const token = authHeader.split(' ')[1];
    // Use the API client to verify the token and get the user
    const supabase = await createApiClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return { user: null, error: error?.message || 'User not found' };
    }
    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return { user: null, error: error.message };
  }
}

/**
 * Get the current authenticated user from server components
 */
export async function getServerUser() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return { user, error: null };
  } catch (error: any) {
    console.error('Error getting server user:', error);
    return { user: null, error: error.message };
  }
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: any, role: string): boolean {
  if (!user) return false;
  return user.user_metadata?.role === role;
}

/**
 * Verifies if the session is valid and returns auth status (API route)
 */
export async function verifySession(req: NextRequest) {
  try {
    // Check for token in cookie rather than auth header
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return { authenticated: false, error: 'No cookies provided' };
    }
    // Use supabase API client to verify the session
    const supabase = await createApiClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return { authenticated: false, error: error?.message || 'Session invalid' };
    }
    return {
      authenticated: true,
      user: data.user,
      error: null
    };
  } catch (error: any) {
    console.error('Session verification error:', error);
    return { authenticated: false, error: error.message };
  }
}
