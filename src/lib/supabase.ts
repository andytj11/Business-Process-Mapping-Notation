import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Debug helper function to check auth state (client-side only)
export async function getAuthDebugInfo() {
  const supabase = createClient();
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    return {
      hasUser: !!userData.user,
      userError: userError?.message || null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return { error: 'Failed to get debug info', timestamp: new Date().toISOString() };
  }
}
