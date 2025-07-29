import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma'; // Assuming withRetry is in @/lib/prisma
import { handleApiError } from '@/lib/api-utils';

interface NodeData {
  id?: string;
  name: string;
  type?: string;
  shortDescription?: string;
  parameters?: ProcessParameterData[];
}

interface ProcessParameterData {
  id?: string;
  name: string;
  type: string;
  mandatory: boolean;
  options?: string[];
}

// Get a specific process by ID
export async function GET(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const processId = context.params.processId;
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    const process = await withRetry(async () => {
      return await prisma.process.findUnique({
        where: { id: processId },
        include: { // Include all relevant details for a single process view
          Node: {
            include: {
              ProcessParameter: true
            }
          },
          ProcessParameter: { // Parameters directly attached to the process
             where: { nodeId: null }
          },
          // Potentially include other relations like DocumentImage, Event, etc. if needed
        }
      });
    });
    
    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    return NextResponse.json(process);
  } catch (error: any) {
    return handleApiError(error, 'Error fetching process');
  }
}

// Update a process comprehensively (basic info, nodes, parameters)
export async function PUT(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const processId = context.params.processId;
    const { 
        processName, 
        shortDescription, 
        nodeList = [], 
        processParameters = [] 
    }: {
        processName?: string;
        shortDescription?: string;
        nodeList?: NodeData[];
        processParameters?: ProcessParameterData[];
    } = await req.json();
    
    if (!processId) {
      return NextResponse.json({ message: "Process ID is required" }, { status: 400 });
    }
    
    const existingProcess = await prisma.process.findUnique({
      where: { id: processId }
    });
    
    if (!existingProcess) {
      return NextResponse.json({ message: "Process not found" }, { status: 404 });
    }
    
    // Transaction to update process, its parameters, and nodes
    const updatedProcess = await prisma.$transaction(async (tx) => {
      // 1. Update process basic information
      const currentProcess = await tx.process.update({
        where: { id: processId },
        data: {
          ...(processName && { name: processName }),
          ...(shortDescription && { shortDescription }),
          updatedAt: new Date(), // Manually set updatedAt
        }
      });

      // 2. Handle process-level parameters (delete existing, create new)
      await tx.processParameter.deleteMany({
        where: { 
          processId: processId,
          nodeId: null 
        }
      });
      if (processParameters.length > 0) {
        await tx.processParameter.createMany({
          data: processParameters.map(param => ({
            id: param.id || crypto.randomUUID(),
            name: param.name,
            type: param.type,
            mandatory: !!param.mandatory,
            options: param.options || [],
            processId: processId,
            nodeId: null
          }))
        });
      }
      
      // 3. Handle nodes and their parameters (delete existing, create new)
      // Prisma schema `onDelete: Cascade` on Node->Process should handle Node deletion
      // and NodeParameter deletion when Node is deleted.
      // So, deleting nodes will also delete their parameters.
      await tx.node.deleteMany({
        where: { processId: processId }
      });
      
      if (nodeList.length > 0) {
        for (const node of nodeList) {
          const nodeParams = node.parameters || [];
          await tx.node.create({
            data: {
              id: node.id || crypto.randomUUID(),
              name: node.name,
              type: node.type || 'Task', // Default type if not provided
              shortDescription: node.shortDescription,
              processId: processId,
              updatedAt: new Date(), // Manually set updatedAt
              ProcessParameter: { // Renamed from 'parameters' to 'ProcessParameter' for Prisma relation
                create: nodeParams.map(param => ({
                  id: param.id || crypto.randomUUID(),
                  name: param.name || '',
                  type: param.type || 'Textbox', // Default type
                  mandatory: !!param.mandatory,
                  options: param.options || []
                }))
              }
            }
          });
        }
      }
      return currentProcess; // Return the updated process meta
    });
    
    // Refetch the process with all its updated relations
    const refreshedProcess = await prisma.process.findUnique({
      where: { id: processId },
      include: {
        Node: { include: { ProcessParameter: true } }, // Renamed from 'parameters'
        ProcessParameter: { where: { nodeId: null } } // Renamed from 'parameters'
      }
    });
    
    return NextResponse.json(refreshedProcess, { status: 200 });

  } catch (error) {
    return handleApiError(error, "Error updating process");
  }
}


// Partially update a process (e.g., name, bpmnXml, bpmnId)
export async function PATCH(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const processId = context.params.processId;
    const { name, bpmnXml, bpmnId, shortDescription } = await req.json();

    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }

    const dataToUpdate: { name?: string, bpmnXml?: string, bpmnId?: string, shortDescription?: string, updatedAt?: Date } = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (bpmnXml !== undefined) dataToUpdate.bpmnXml = bpmnXml;
    if (bpmnId !== undefined) dataToUpdate.bpmnId = bpmnId;
    if (shortDescription !== undefined) dataToUpdate.shortDescription = shortDescription;

    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }
    dataToUpdate.updatedAt = new Date(); // Manually set updatedAt

    const updatedProcess = await withRetry(async () => {
      return await prisma.process.update({
        where: { id: processId },
        data: dataToUpdate
      });
    });
    
    return NextResponse.json(updatedProcess);
  } catch (error: any) {
    // Check if it's a Prisma known error (e.g., P2025 Record not found)
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    return handleApiError(error, 'Error partially updating process');
  }
}

// Delete a process by ID
export async function DELETE(
  req: Request,
  context: { params: { processId: string } }
) {
  try {
    const processId = context.params.processId;
    
    if (!processId) {
      return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }
    
    // Check if process exists before attempting delete
    const existingProcess = await withRetry(async () => {
      return await prisma.process.findUnique({
        where: { id: processId }
      });
    });
    
    if (!existingProcess) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    
    // Deletion will cascade to Nodes, ProcessParameters, DocumentImages, etc. 
    // as defined in prisma.schema
    await withRetry(async () => {
      return await prisma.process.delete({
        where: { id: processId }
      });
    });
    
    return NextResponse.json({ success: true, message: 'Process deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma error code for record not found during delete
        return NextResponse.json({ error: 'Process not found or already deleted' }, { status: 404 });
    }
    return handleApiError(error, 'Error deleting process');
  }
}
