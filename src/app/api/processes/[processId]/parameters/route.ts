import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';

interface ProcessParameterData {
  id?: string;
  name: string;
  type: string;
  mandatory: boolean;
  options?: string[];
}

// Get parameters for a specific process (where nodeId is null)
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
    const process = await prisma.process.findUnique({ where: { id: processId } });
    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    // Fetch all parameters associated with this process where nodeId is null
    const parameters = await prisma.processParameter.findMany({
      where: { 
        processId: processId,
        nodeId: null 
      }
    });
    
    return NextResponse.json(parameters);
  } catch (error: any) {
    return handleApiError(error, 'Error fetching process parameters');
  }
}

// Create new parameters for a process (replaces existing process-specific parameters)
export async function POST(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const processId = context.params.processId;
    const body = await req.json();
    // Expecting an array of parameters in the body
    const parameters: ProcessParameterData[] = body.parameters; 
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    if (!parameters || !Array.isArray(parameters)) {
      return NextResponse.json(
        { error: 'Parameters array is required in the request body' }, 
        { status: 400 }
      );
    }

    // Check if process exists
    const process = await prisma.process.findUnique({ where: { id: processId } });
    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    // Transaction: Delete existing process-specific parameters and create new ones
    const result = await prisma.$transaction(async (tx) => {
      await tx.processParameter.deleteMany({
        where: { 
          processId: processId,
          nodeId: null 
        }
      });

      if (parameters.length === 0) {
        return { count: 0 }; // No new parameters to create
      }

      const createdParameters = await tx.processParameter.createMany({
        data: parameters.map(param => ({
          id: param.id || crypto.randomUUID(),
          name: param.name,
          type: param.type,
          mandatory: !!param.mandatory,
          options: param.options || [],
          processId: processId,
          nodeId: null // Ensure these are process-level parameters
        }))
      });
      return createdParameters;
    });
    
    return NextResponse.json(
      { count: result.count, success: true }, 
      { status: 201 }
    );
  } catch (error: any) {
    return handleApiError(error, 'Error creating process parameters');
  }
}

// Update a specific process parameter by its ID
export async function PUT(
  req: Request,
  context: { params: { processId: string } } // processId from route, but paramId from body/query
) {
  try {
    // const processId = context.params.processId; // processId context, might not be needed if paramId is unique
    const body = await req.json();
    const { id: parameterId, ...updateData } = body; // Expect parameter ID in the body
    
    if (!parameterId) {
      return NextResponse.json({ error: 'Parameter ID (id) is required in the request body' }, { status: 400 });
    }
    
    // Ensure no attempt to change processId or nodeId via this route
    delete updateData.processId;
    delete updateData.nodeId;

    const updatedParameter = await prisma.processParameter.update({
      where: { id: parameterId },
      data: {
        ...updateData,
        // Ensure options is an array if provided
        ...(updateData.options && { options: Array.isArray(updateData.options) ? updateData.options : [] }),
      }
    });
    
    return NextResponse.json(updatedParameter);
  } catch (error: any) {
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Parameter not found' }, { status: 404 });
    }
    return handleApiError(error, 'Error updating process parameter');
  }
}

// Delete a specific process parameter by its ID (passed as query param)
export async function DELETE(
  req: Request,
  context: { params: { processId: string } } // processId from route
) {
  try {
    // const processId = context.params.processId; // processId context
    const { searchParams } = new URL(req.url);
    const parameterId = searchParams.get('id'); // Parameter ID from query string
    
    if (!parameterId) {
      return NextResponse.json({ error: 'Parameter ID (id) is required as a query parameter' }, { status: 400 });
    }
    
    await prisma.processParameter.delete({
      where: { 
        id: parameterId,
        // Optional: Add processId to ensure deleting parameter only from this process
        // processId: processId 
      }
    });
    
    return NextResponse.json({ success: true, message: 'Parameter deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma error for record to delete not found
        return NextResponse.json({ error: 'Parameter not found' }, { status: 404 });
    }
    return handleApiError(error, 'Error deleting process parameter');
  }
}
