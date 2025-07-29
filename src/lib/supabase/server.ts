import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Client for server-side operations acting within the context of the current user (e.g., reading their session)
// Uses ANON_KEY by default for operations, relying on user's JWT for permissions.
export async function createSupabaseServerClient() {
  const cookieStore = cookies(); // cookies() is synchronous

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) { // Ensured async
          return (await cookieStore).get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) { // Ensured async
          try {
            // Attempt to set cookie if running in a context that allows it (e.g., Route Handler)
            (await
              // Attempt to set cookie if running in a context that allows it (e.g., Route Handler)
              cookieStore).set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) { // Ensured async
          try {
            // Attempt to remove cookie if running in a context that allows it
            (await
              // Attempt to remove cookie if running in a context that allows it
              cookieStore).set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

// Client for admin operations using the service role key.
// This client can bypass RLS and perform privileged actions.
// It can also be used to get the currently authenticated user if a session cookie exists.
export async function createSupabaseAdminClient() {
    const cookieStore = cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                async get(name: string) { // Ensured async
                    return (await cookieStore).get(name)?.value;
                },
                async set(name: string, value: string, options: CookieOptions) { // Ensured async
                    try {
                        (await cookieStore).set({ name, value, ...options });
                    } catch (error) {
                        // Ignore errors in server components or contexts where set is not allowed
                    }
                },
                async remove(name: string, options: CookieOptions) { // Ensured async
                    try {
                        (await cookieStore).set({ name, value: '', ...options });
                    } catch (error) { // Fixed syntax: added braces
                        // Ignore errors in server components or contexts where remove is not allowed
                    }
                },
            },
            auth: {
                autoRefreshToken: false, // Typically false for server-side admin client
                persistSession: false,   // Typically false for server-side admin client
            }
        }
    );
}
