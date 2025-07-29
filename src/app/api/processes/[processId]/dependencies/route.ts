import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';

interface DependencyData {
  parentProcessId: string;
  trigger?: string;
}

// Get dependencies for a specific process (where the processId in path is the child)
export async function GET(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const childProcessId = context.params.processId;

    if (!childProcessId) {
      return NextResponse.json({ error: 'Process ID (child) is required in path' }, { status: 400 });
    }

    // Check if the child process exists
    const processExists = await prisma.process.findUnique({
      where: { id: childProcessId },
    });

    if (!processExists) {
      return NextResponse.json({ error: 'Child process not found' }, { status: 404 });
    }

    const dependencies = await prisma.processDependency.findMany({
      where: {
        processId: childProcessId, // processId in ProcessDependency is the child
      },
      include: { // Optionally include parent process details
        Process_ProcessDependency_parentProcessIdToProcess: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(dependencies);
  } catch (error) {
    return handleApiError(error, 'Error fetching process dependencies');
  }
}

// Create a new dependency for the process (where processId in path is the child)
export async function POST(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const childProcessId = context.params.processId;
    const { parentProcessId, trigger }: DependencyData = await req.json();

    if (!childProcessId) {
      return NextResponse.json({ error: 'Process ID (child) is required in path' }, { status: 400 });
    }
    if (!parentProcessId) {
      return NextResponse.json({ error: 'parentProcessId is required in body' }, { status: 400 });
    }

    if (childProcessId === parentProcessId) {
      return NextResponse.json({ error: 'A process cannot depend on itself' }, { status: 400 });
    }

    // Check if both parent and child processes exist
    const [childProcess, parentProcess] = await prisma.$transaction([
      prisma.process.findUnique({ where: { id: childProcessId } }),
      prisma.process.findUnique({ where: { id: parentProcessId } }),
    ]);

    if (!childProcess) {
      return NextResponse.json({ error: 'Child process not found' }, { status: 404 });
    }
    if (!parentProcess) {
      return NextResponse.json({ error: 'Parent process not found' }, { status: 404 });
    }

    const newDependency = await prisma.processDependency.create({
      data: {
        id: crypto.randomUUID(),
        parentProcessId: parentProcessId,
        processId: childProcessId, // child process
        trigger: trigger,
      },
    });

    return NextResponse.json(newDependency, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint violation
      return NextResponse.json({ error: 'This dependency already exists.' }, { status: 409 });
    }
    return handleApiError(error, 'Error creating process dependency');
  }
}

// Delete a specific dependency by its ID
export async function DELETE(
  req: Request,
  context: { params: { processId: string } } // processId in path is the child
) {
  try {
    const childProcessId = context.params.processId; // Context for which process's dependencies we are managing
    const { searchParams } = new URL(req.url);
    const dependencyId = searchParams.get('dependencyId'); // ID of the ProcessDependency record

    if (!dependencyId) {
      return NextResponse.json({ error: 'dependencyId query parameter is required' }, { status: 400 });
    }
     if (!childProcessId) {
      return NextResponse.json({ error: 'Process ID (child) is required in path' }, { status: 400 });
    }


    // Optional: Verify the dependency actually involves the childProcessId from the path
    const dependency = await prisma.processDependency.findUnique({
        where: { id: dependencyId }
    });

    if (!dependency) {
        return NextResponse.json({ error: 'Dependency not found' }, { status: 404 });
    }

    if (dependency.processId !== childProcessId && dependency.parentProcessId !== childProcessId) {
        // This check ensures the dependency being deleted is related to the processId in the URL path.
        // Depending on desired behavior, you might only check dependency.processId === childProcessId
        return NextResponse.json({ error: 'Dependency does not belong to the specified process context' }, { status: 403 });
    }

    await prisma.processDependency.delete({
      where: {
        id: dependencyId,
      },
    });

    return NextResponse.json({ success: true, message: 'Dependency deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') { // Record to delete not found
      return NextResponse.json({ error: 'Dependency not found' }, { status: 404 });
    }
    return handleApiError(error, 'Error deleting process dependency');
  }
}
