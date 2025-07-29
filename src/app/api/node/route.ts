import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';
import { createApiClient } from '@/utils/supabase/server';

// Helper to require authentication
async function requireUser() {
  const supabase = await createApiClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user;
}

// Get nodes (filter by process ID if provided)
export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const processId = searchParams.get('processId');
    const nodeId = searchParams.get('id');
    
    if (nodeId) {
      // Get a specific node
      const node = await prisma.node.findUnique({
        where: { id: nodeId }
      });
      
      if (!node) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }
      
      return NextResponse.json(node);
    } else if (processId) {
      // Get nodes by process ID
      const nodes = await prisma.node.findMany({
        where: { processId }
      });
      
      return NextResponse.json(nodes);
    } else {
      // Get all nodes (may want to limit this in production)
      const nodes = await prisma.node.findMany({
        take: 100
      });
      
      return NextResponse.json(nodes);
    }
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    return handleApiError(error, 'Error fetching nodes');
  }
}

// Create a new node
export async function POST(req: Request) {
  try {
    await requireUser();
    const body = await req.json();
    const { name, type, processId, bpmnId, shortDescription, documentContent } = body;
    
    if (!name || !processId) {
      return NextResponse.json({ error: 'Name and processId are required' }, { status: 400 });
    }
    // Check for existing node with same bpmnId and processId
    if (bpmnId) {
      const existingNode = await prisma.node.findFirst({
        where: { bpmnId, processId }
      });
      if (existingNode) {
        return NextResponse.json(existingNode, { status: 200 });
      }
    }
    const node = await prisma.node.create({
      data: {
        id: crypto.randomUUID(),
        name,
        type: type || 'Task', // Default type if not provided
        processId,
        bpmnId: bpmnId || null,
        shortDescription: shortDescription || null,
        documentContent: documentContent || undefined, // Prisma handles undefined as no-op for Json?
        updatedAt: new Date(), // Manually set updatedAt
      }
    });
    
    return NextResponse.json(node, { status: 201 });
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    return handleApiError(error, 'Error creating node');
  }
}

// Update a node
export async function PATCH(req: Request) {
  try {
    await requireUser();
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Node ID is required' }, { status: 400 });
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }
    
    const node = await prisma.node.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(), // Manually set updatedAt
      }
    });
    
    return NextResponse.json(node);
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }
    return handleApiError(error, 'Error updating node');
  }
}

// Delete a node
export async function DELETE(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Node ID is required' }, { status: 400 });
    }
    
    await prisma.node.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Node deleted successfully' });
  } catch (error: any) {
    if (error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }
    return handleApiError(error, 'Error deleting node');
  }
}
