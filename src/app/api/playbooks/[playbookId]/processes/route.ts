import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma'; // Assuming withRetry is in lib/prisma
import { handleApiError } from '@/lib/api-utils';

interface PlaybookProcessesParams {
  params: {
    playbookId: string;
  };
}

// GET all processes for a specific playbook
export async function GET(
  _req: Request,
  { params }: PlaybookProcessesParams
) {
  try {
    const { playbookId } = params;

    if (!playbookId) {
      // This case should ideally be caught by Next.js routing if playbookId is missing in URL
      return NextResponse.json({ error: 'Playbook ID is required' }, { status: 400 });
    }

    const playbook = await withRetry(async () => {
      return await prisma.playbook.findUnique({
        where: { id: playbookId, isDeleted: false },
      });
    });

    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
    }

    const processes = await withRetry(async () => {
      return await prisma.process.findMany({
        where: { playbookId },
        orderBy: { name: 'asc' },
      });
    });

    return NextResponse.json(processes);
  } catch (error: any) {
    return handleApiError(error, `Error fetching processes for playbook ${params.playbookId}`);
  }
}
