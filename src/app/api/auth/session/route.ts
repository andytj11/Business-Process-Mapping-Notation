import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-utils';
import { createApiClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createApiClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('[API] Supabase auth.getUser() error:', error);
      return handleApiError(error, 'Authentication error retrieving user');
    }
    return NextResponse.json({
      user: user || null,
      authenticated: !!user,
    });
  } catch (error: any) {
    console.error('[API] Session route unexpected error:', error);
    return handleApiError(error, 'Internal server error in session route');
  }
}
