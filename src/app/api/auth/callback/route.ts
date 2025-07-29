import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-utils';
import { createApiClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createApiClient();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (code) {
      console.log("Auth callback received with code, exchanging for session...");
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // Specific error handling for session exchange failure
        console.error('Error exchanging code for session:', error);
        return NextResponse.json(
          { error: 'Failed to exchange code for session', details: error.message },
          { status: 400 } // Or 500 if it's a server-side Supabase issue
        );
      }
    } else {
      // Handle missing code scenario
      return NextResponse.json(
        { error: 'Authorization code is missing in callback' },
        { status: 400 }
      );
    }

    // Get the redirect URL from the query parameters or default to dashboard
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    console.log(`Auth callback redirecting to: ${redirectTo}`);
    // Ensure the redirect URL is absolute or correctly based
    const redirectUrl = new URL(redirectTo, new URL(req.url).origin);
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    return handleApiError(error, 'Error during auth callback');
  }
}
