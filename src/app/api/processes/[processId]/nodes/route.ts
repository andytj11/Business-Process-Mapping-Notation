import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma'; // Assuming withRetry is in @/lib/prisma
import { handleApiError } from '@/lib/api-utils';

// Get all nodes for a specific process
export async function GET(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const processId = context.params.processId;
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    // Check if process exists
    const process = await withRetry(async () => {
      return await prisma.process.findUnique({
        where: { id: processId }
      });
    });
    
    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    // Get all nodes for this process, including their parameters
    const nodes = await withRetry(async () => {
      return await prisma.node.findMany({
        where: { processId },
        include: {
            ProcessParameter: true // Include parameters for each node
        },
        orderBy: { createdAt: 'asc' } // Consistent ordering
      });
    });
    
    return NextResponse.json(nodes);
  } catch (error: any) {
    return handleApiError(error, 'Error fetching nodes for process');
  }
}
