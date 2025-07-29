import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware' // Ensure this path is correct
import { createServerClient, type CookieOptions } from '@supabase/ssr' // Added import

// Routes that are public and don't need any session state or redirection logic in middleware
const PUBLIC_STATIC_ASSET_PATTERNS = [
  /\.(?:svg|png|jpg|jpeg|gif|webp)$/, // Common image formats
  /^\/fonts\//, // Font files
  /^\/images\//, // Your public images folder
  /^\/static\//, // Your public static folder
  /^\/manifest\.json$/,
  /^\/robots\.txt$/,
  /^\/favicon\.ico$/,
];

const PUBLIC_API_ROUTES = [
  '/api/auth/callback', // Supabase auth callback
  // Add other specific public API routes if any
];

const PUBLIC_PAGE_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/about',
  '/error', // An error page should be public
  '/auth/confirm', // Auth confirmation page
];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and specific public files
  if (PUBLIC_STATIC_ASSET_PATTERNS.some(pattern => pattern.test(pathname))) {
    return NextResponse.next();
  }
  
  // The updateSession function handles session refresh for all other routes.
  // It's important for it to run to keep the session alive.
  const response = await updateSession(request);

  // After session is potentially refreshed, get user for protection logic
  // We need a new Supabase client instance here that can read the potentially updated cookies from `updateSession`
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { response.cookies.delete({ name, ...options }) },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();

  // If user is not logged in and trying to access a protected page
  if (!user && !PUBLIC_PAGE_ROUTES.includes(pathname) && !PUBLIC_API_ROUTES.includes(pathname) && !pathname.startsWith('/api/auth')) {
    // For API routes, let them handle their own 401s if not public
    if (pathname.startsWith('/api/')) {
        // Allow request to proceed; API route will handle auth.
        // console.log(`[Middleware] No session for protected API route ${pathname}. Allowing request to proceed.`);
        return response;
    }
    // For page routes, redirect to login
    // console.log(`[Middleware] No session for protected page ${pathname}, redirecting to login.`);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access login/signup, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    // console.log(`[Middleware] User logged in, redirecting from ${pathname} to /dashboard/admin.`);
    return NextResponse.redirect(new URL('/dashboard/admin', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - manifest.json, robots.txt, favicon.ico (specific public files)
     * - Content under /fonts, /images, /static (your public asset folders)
     * - Common image extensions (svg, png, jpg, jpeg, gif, webp)
     * This aims to run the middleware on pages and API routes, not static assets.
     */
    '/((?!_next/static|_next/image|manifest.json|robots.txt|favicon.ico|fonts/|images/|static/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
