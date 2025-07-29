import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-utils';
import { createAdminClient } from '@/utils/supabase/server'; // Using admin client for listUsers

export async function GET(req: Request) {
  // Ensure SUPABASE_SERVICE_ROLE_KEY is set in your .env.local for createAdminClient to work
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("API User Route: SUPABASE_SERVICE_ROLE_KEY not set for admin client.");
    return NextResponse.json(
      { error: "Supabase admin client is not configured on the server. Check server logs." },
      { status: 500 }
    );
  }
  const supabase = createAdminClient();

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
  }

  try {
    // Fetch all users. Consider pagination if you have a very large number of users.
    // Default perPage is 50 for listUsers.
    const { data, error: listUsersError } = await supabase.auth.admin.listUsers({
      // perPage: 1000 // Example: Increase if needed, max is typically 1000 for some Supabase plans
    });

    if (listUsersError) {
      console.error('Supabase admin API error (listUsers):', listUsersError);
      return handleApiError(listUsersError, `Error fetching users from Supabase: ${listUsersError.message}`);
    }

    const user = data.users.find((u: any) => u.email === email);

    if (user) {
      return NextResponse.json({ id: user.id, email: user.email }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Catch-all error in /api/user GET:', error);
    return handleApiError(error, 'Failed to retrieve user data due to an unexpected error.');
  }
}
