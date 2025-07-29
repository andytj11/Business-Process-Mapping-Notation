import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';
import { createClient } from '@/utils/supabase/server'; // Updated import

export async function GET(req: Request) {
  try {
    // Get authenticated user from supabase cookie
    const supabase = createClient(); // Use the new server client
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Authentication error in implementations endpoint:', userError.message);
      return NextResponse.json({ error: 'Authentication error: ' + userError.message }, { status: 401 });
    }

    if (!user) {
      console.error('No authenticated user found in implementations endpoint');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    console.log(`Fetching implementations for user ID: ${user.id}`);

    const implementedPlaybooks = await prisma.playbook.findMany({
      where: {
        ownerId: user.id,
        isDeleted: false,
        sourcePlaybookId: {
          not: null, // Ensures it's a copy
        },
      },
      include: {
        sourcePlaybook: { // Include the original playbook to get its name
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(implementedPlaybooks, { status: 200 });
  } catch (error: any) {
    console.error('Error in implementations endpoint:', error);
    return handleApiError(error, 'Error fetching implemented playbooks');
  }
}
