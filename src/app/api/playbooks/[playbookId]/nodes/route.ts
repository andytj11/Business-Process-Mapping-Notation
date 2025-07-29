import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';

interface PlaybookNodesParams {
  params: {
    playbookId: string;
  };
}

// GET all nodes for a specific playbook (across all processes)
export async function GET(
  _req: Request,
  { params }: PlaybookNodesParams
) {
  try {
    const { playbookId } = params;

    if (!playbookId) {
      return NextResponse.json({ error: 'Playbook ID is required' }, { status: 400 });
    }

    const playbook = await prisma.playbook.findUnique({
      where: { id: playbookId, isDeleted: false },
    });

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }

    const processes = await prisma.process.findMany({
      where: { playbookId },
      select: { id: true },
    });

    if (processes.length === 0) {
      return NextResponse.json([]); // No processes, so no nodes
    }

    const processIds = processes.map(process => process.id);

    const nodes = await prisma.node.findMany({
      where: {
        processId: {
          in: processIds,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(nodes);
  } catch (error: any) {
    return handleApiError(error, `Error fetching nodes for playbook ${params.playbookId}`);
  }
}
