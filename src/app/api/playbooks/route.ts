import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma'; // Assuming withRetry is in lib/prisma
import { handleApiError } from '@/lib/api-utils';
import { Status } from '@prisma/client';

// GET all playbooks, optionally filtered by ownerId, status, or isCopy
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId');
    const statusParam = searchParams.get('status');
    const isCopyParam = searchParams.get('isCopy');

    let whereClause: any = { isDeleted: false };

    if (ownerId) {
      whereClause.ownerId = ownerId;
    }

    if (statusParam) {
      if (Object.values(Status).includes(statusParam as Status)) {
        whereClause.status = statusParam as Status;
      } else {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
    }
    
    // If isCopy is 'false', we only want original playbooks (sourcePlaybookId is null)
    // If isCopy is 'true', we want copies (sourcePlaybookId is not null) - handled by /implementations route
    // If isCopy is not provided, we don't filter by sourcePlaybookId (gets all for owner)
    if (isCopyParam === 'false') {
      whereClause.sourcePlaybookId = null;
    } else if (isCopyParam === 'true') {
      whereClause.sourcePlaybookId = { not: null };
    }

    // Defensive check: ensure Prisma is initialized
    if (!prisma || !prisma.playbook) {
      return handleApiError(new Error("Prisma client or playbook model not available."), "Server misconfiguration.");
    }

    const playbooks = await withRetry(async () => {
      return await prisma.playbook.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    return NextResponse.json(playbooks || []);
  } catch (error: any) {
    return handleApiError(error, 'Error fetching playbooks');
  }
}

// POST - Create a new playbook
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ownerId, shortDescription } = body;

    if (!name) {
      return NextResponse.json({ error: 'Playbook name is required' }, { status: 400 });
    }
    if (!ownerId) {
      return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
    }

    const playbook = await prisma.playbook.create({
      data: {
        id: crypto.randomUUID(),
        name,
        ownerId,
        shortDescription: shortDescription || null,
        updatedAt: new Date(), // createdAt is default, updatedAt should be set
        // status will use default from schema (PLANNING)
      },
    });

    return NextResponse.json(playbook, { status: 201 });
  } catch (error: any) {
    if ((error as any).code === 'P2002') { // Unique constraint violation
      return NextResponse.json({ error: 'A playbook with this ID already exists or unique constraint failed.' }, { status: 409 });
    }
    if ((error as any).code === 'P2003') { // Foreign key constraint failed
      return NextResponse.json({ error: 'The owner ID provided does not exist.' }, { status: 400 });
    }
    return handleApiError(error, 'Error creating playbook');
  }
}
