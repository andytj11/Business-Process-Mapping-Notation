import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';
import { Status } from '@prisma/client';

interface PlaybookParams {
  params: {
    playbookId: string;
  };
}

// GET a single playbook by ID
export async function GET(req: Request, { params }: PlaybookParams) {
  try {
    const { playbookId } = params;
    const { searchParams } = new URL(req.url);
    
    const includeProcess = searchParams.get('includeProcess') === 'true';
    const includeNodes = searchParams.get('includeNodes') === 'true';
    const includeNodeParams = searchParams.get('includeNodeParams') === 'true';
    const includeAll = searchParams.get('includeAll') === 'true';

    const playbook = await prisma.playbook.findUnique({
      where: {
        id: playbookId,
        isDeleted: false,
      },
      include: {
        Process: (includeProcess || includeAll) ? {
          include: {
            Node: (includeNodes || includeAll) ? {
              include: {
                ProcessParameter: (includeNodeParams || includeAll),
              },
            } : includeNodes,
            // Relations like parentToProcesses, nextToProcesses need to be defined in schema to be included
            // Assuming ProcessDependency relations:
            // ProcessDependency_ProcessDependency_parentProcessIdToProcess : includeAll,
            // ProcessDependency_ProcessDependency_processIdToProcess: includeAll,
          },
        } : includeProcess,
      },
    });

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }

    return NextResponse.json(playbook);
  } catch (error: any) {
    return handleApiError(error, `Error fetching playbook ${params.playbookId}`);
  }
}

// PUT - Replace a playbook (Idempotent)
export async function PUT(req: Request, { params }: PlaybookParams) {
  try {
    const { playbookId } = params;
    const body = await req.json();
    // For PUT, all required fields should be present to replace the resource
    const { name, ownerId, shortDescription, documentContent, status } = body;

    if (!name || !ownerId) {
      return NextResponse.json({ error: 'Name and ownerId are required for PUT' }, { status: 400 });
    }
    if (status && !Object.values(Status).includes(status as Status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const updatedPlaybook = await prisma.playbook.update({
      where: { id: playbookId, isDeleted: false }, // Ensure playbook exists and is not deleted
      data: {
        name,
        ownerId, // Be cautious updating ownerId, ensure this is intended
        shortDescription: shortDescription !== undefined ? shortDescription : null,
        documentContent: documentContent !== undefined ? documentContent : null,
        status: status as Status, // Ensure status is a valid enum or handle validation
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedPlaybook);
  } catch (error: any) {
     if ((error as any).code === 'P2025') { // Record to update not found
      return NextResponse.json({ error: 'Playbook not found or already deleted' }, { status: 404 });
    }
    return handleApiError(error, `Error updating playbook ${params.playbookId} with PUT`);
  }
}

// PATCH - Update playbook fields
export async function PATCH(req: Request, { params }: PlaybookParams) {
  try {
    const { playbookId } = params;
    const body = await req.json();
    const { name, shortDescription, documentContent, status } = body;

    if (Object.keys(body).length === 0) {
        return NextResponse.json({ error: 'Request body cannot be empty for PATCH' }, { status: 400 });
    }
    if (status && !Object.values(Status).includes(status as Status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const dataToUpdate: any = { updatedAt: new Date() };
    if (name !== undefined) dataToUpdate.name = name;
    if (shortDescription !== undefined) dataToUpdate.shortDescription = shortDescription;
    if (documentContent !== undefined) dataToUpdate.documentContent = documentContent;
    if (status !== undefined) dataToUpdate.status = status as Status;


    const updatedPlaybook = await prisma.playbook.update({
      where: { id: playbookId, isDeleted: false },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedPlaybook);
  } catch (error: any) {
    if ((error as any).code === 'P2025') { // Record to update not found
      return NextResponse.json({ error: 'Playbook not found or already deleted' }, { status: 404 });
    }
    return handleApiError(error, `Error patching playbook ${params.playbookId}`);
  }
}

// DELETE - Soft delete a playbook
export async function DELETE(req: Request, { params }: PlaybookParams) {
  try {
    const { playbookId } = params;

    const existingPlaybook = await prisma.playbook.findUnique({
      where: { id: playbookId, isDeleted: false },
    });

    if (!existingPlaybook) {
      return NextResponse.json({ error: 'Playbook not found or already deleted' }, { status: 404 });
    }

    const deletedPlaybook = await prisma.playbook.update({
      where: { id: playbookId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Playbook "${deletedPlaybook.name}" has been soft deleted.`,
      success: true,
    });
  } catch (error: any) {
    if ((error as any).code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }
    return handleApiError(error, `Error deleting playbook ${params.playbookId}`);
  }
}
