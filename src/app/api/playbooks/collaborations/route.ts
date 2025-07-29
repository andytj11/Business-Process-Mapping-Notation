import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';
import { createClient } from '@/utils/supabase/server'; // Updated import

export async function GET(req: Request) {
  try {
    // Get authenticated user using server client
    const supabase = createClient(); // Use the new server client
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User authentication error:', userError?.message || 'No user found');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Find all playbooks where the user is a collaborator but not the owner
    const collaborationPlaybooks = await prisma.playbookCollaborator.findMany({
      where: {
        userId: user.id,
        Playbook: {
          isDeleted: false,
          ownerId: {
            not: user.id, // Exclude playbooks the user owns
          }
        }
      },
      include: {
        Playbook: true
      }
    });

    // Extract just the playbooks from the results
    const playbooks = collaborationPlaybooks.map(collab => collab.Playbook);

    return NextResponse.json(playbooks, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/playbooks/collaborations:', error);
    return handleApiError(error, 'Error fetching collaboration playbooks');
  }
}
