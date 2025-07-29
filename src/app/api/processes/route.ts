import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';
import { createApiClient } from '@/utils/supabase/server';

interface NodeData {
  id?: string; // Optional: ID might not be provided for new nodes
  name: string;
  type: string;
  shortDescription: string | null; // Changed from description
  parameters: ProcessParameterData[];
}

interface ProcessParameterData {
  id?: string; // Optional: ID might not be provided for new parameters
  name: string;
  type: string;
  mandatory: boolean;
  options: string[];
}

interface ProcessDependencyData {
  parentProcessId: string;
  trigger?: string;
}

// Helper to require authentication
async function requireUser() {
  const supabase = await createApiClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user;
}

// Get a list of all processes or processes filtered by playbookId
export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const playbookId = searchParams.get('playbookId');

    if (playbookId) {
      const processes = await prisma.process.findMany({
        where: { playbookId: playbookId },
        include: {
          Node: true, // Includes nodes, adjust if parameters per node are needed directly here
        }
      });
      return NextResponse.json(processes);
    }

    // Get all processes if no playbookId is specified
    const processes = await prisma.process.findMany({
        include: {
            Node: true,
        }
    });
    return NextResponse.json(processes);

  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    return handleApiError(error, "Error fetching processes");
  }
}

// Create a new process
export async function POST(req: Request) {
  try {
    await requireUser();
    const body = await req.json();
    const {
      playbookId,
      processName,
      shortDescription,
      nodeList = [], // Default to empty array if not provided
      processParameters = [], // Default to empty array
      processDependency // Optional
    }: {
      playbookId: string;
      processName: string;
      shortDescription?: string;
      nodeList?: NodeData[];
      processParameters?: ProcessParameterData[];
      processDependency?: ProcessDependencyData;
    } = body;

    if (!processName || !playbookId) {
      return NextResponse.json({ message: "Process name and playbookId are required" }, { status: 400 });
    }

    const newProcess = await prisma.process.create({
      data: {
        id: crypto.randomUUID(),
        name: processName,
        shortDescription: shortDescription,
        playbookId: playbookId,
        updatedAt: new Date(), // Manually setting updatedAt as per old logic
        Node: {
          create: nodeList.map((node: NodeData) => ({
            id: node.id || crypto.randomUUID(),
            name: node.name,
            shortDescription: node.shortDescription, // Ensure this matches
            type: node.type,
            updatedAt: new Date(), // Manually setting updatedAt
            ProcessParameter: {
              create: node.parameters.map((param: ProcessParameterData) => ({
                id: param.id || crypto.randomUUID(),
                name: param.name,
                type: param.type,
                mandatory: param.mandatory,
                options: param.options
              }))
            },
          }))
        },
        ProcessParameter: { // Parameters directly associated with the process
          create: processParameters.map((param: ProcessParameterData) => ({
            id: param.id || crypto.randomUUID(),
            name: param.name,
            type: param.type,
            mandatory: param.mandatory,
            options: param.options,
            nodeId: null // Explicitly set nodeId to null for process-level parameters
          }))
        },
      },
      include: { // Include related data in the response
        Node: {
          include: {
            ProcessParameter: true
          }
        },
        ProcessParameter: true
      }
    });

    if (processDependency && processDependency.parentProcessId) {
      try {
        await prisma.processDependency.create({
          data: {
            id: crypto.randomUUID(),
            parentProcessId: processDependency.parentProcessId,
            processId: newProcess.id,
            trigger: processDependency.trigger,
          }
        });
      } catch (error: any) {
        console.error('Error creating process dependency:', error);
        // Decide if this error should cause the whole request to fail or just be logged
      }
    }

    return NextResponse.json(newProcess, { status: 201 });
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    return handleApiError(error, "Error creating process");
  }
}
