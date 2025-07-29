import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';
import { createAdminClient } from '@/utils/supabase/server';
import { Role } from '@prisma/client';

interface UserDetails {
    id: string;
    email: string | undefined;
    thumbnail: string;
    name?: string; // Future use, not populated from Supabase auth by default
}

interface CollaboratorDetails extends UserDetails {
    role: Role;
}

interface ImplementorDetails extends UserDetails {
    copiedPlaybookId: string;
    copiedPlaybookName: string | null;
}

interface SharingDetailsResponse {
    owner: UserDetails | null;
    collaborators: CollaboratorDetails[];
    implementors: ImplementorDetails[];
}

const generateThumbnail = (email?: string | null): string => {
    if (email && typeof email === 'string' && email.length > 0) {
        return email.charAt(0).toUpperCase();
    }
    return '?';
};

export async function GET(req: Request, { params }: { params: { playbookId: string } }) {
  const { playbookId } = params;
  const supabaseAdmin = await createAdminClient();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // This check might be redundant if createAdminClient handles it, but good for clarity
    console.error("Sharing Details API: Supabase environment variables not set.");
    return NextResponse.json(
      { error: "Supabase admin client is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const playbook = await prisma.playbook.findUnique({
      where: { id: playbookId, isDeleted: false },
      select: { ownerId: true, name: true },
    });

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }

    const collaboratorsDB = await prisma.playbookCollaborator.findMany({
      where: { playbookId },
      select: { userId: true, role: true },
    });

    const implementorLogsDB = await prisma.playbookShareLog.findMany({
      where: { originalPlaybookId: playbookId },
      select: { 
        sharedWithUserId: true, 
        copiedPlaybookId: true,
        copiedPlaybook: {
          select: { name: true }
        }
      },
    });

    const userIds = new Set<string>();
    if (playbook.ownerId) {
        userIds.add(playbook.ownerId);
    }
    collaboratorsDB.forEach(c => userIds.add(c.userId));
    implementorLogsDB.forEach(log => userIds.add(log.sharedWithUserId));

    const userDetailsMap = new Map<string, UserDetails>();

    if (userIds.size > 0) {
      const { data: supabaseUsersData, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
        // page: 1, perPage: 1000 // Adjust if dealing with >1000 users, default is 50
      });
      
      if (listUsersError) {
        console.error('Supabase admin API error (listUsers for sharing-details):', listUsersError);
        return handleApiError(listUsersError, `Error fetching user details from Supabase: ${listUsersError.message}`);
      }

      supabaseUsersData.users.forEach((u: any) => {
        if (userIds.has(u.id)) {
          userDetailsMap.set(u.id, {
            id: u.id,
            email: u.email,
            thumbnail: generateThumbnail(u.email),
            // name: u.user_metadata?.full_name // Example if you store full_name in metadata
          });
        }
      });
    }
    
    const response: SharingDetailsResponse = {
      owner: null,
      collaborators: [],
      implementors: [],
    };

    if (playbook.ownerId) {
        response.owner = userDetailsMap.get(playbook.ownerId) || {
            id: playbook.ownerId,
            email: 'Unknown Owner',
            thumbnail: '?',
        };
    }

    response.collaborators = collaboratorsDB.map(collab => {
      const userDetail = userDetailsMap.get(collab.userId);
      return {
        id: collab.userId,
        email: userDetail?.email || 'Unknown Collaborator',
        thumbnail: userDetail?.thumbnail || '?',
        name: userDetail?.name,
        role: collab.role,
      };
    });

    response.implementors = implementorLogsDB.map(log => {
      const userDetail = userDetailsMap.get(log.sharedWithUserId);
      return {
        id: log.sharedWithUserId,
        email: userDetail?.email || 'Unknown Implementor',
        thumbnail: userDetail?.thumbnail || '?',
        name: userDetail?.name,
        copiedPlaybookId: log.copiedPlaybookId,
        copiedPlaybookName: log.copiedPlaybook?.name || 'Unnamed Copied Playbook',
      };
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    return handleApiError(error, `Error fetching sharing details for playbook ${playbookId}`);
  }
}
