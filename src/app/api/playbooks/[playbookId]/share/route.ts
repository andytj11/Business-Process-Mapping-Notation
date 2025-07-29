import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';
import { PrismaClient, Role, Playbook as PrismaPlaybook, Process as PrismaProcess, Node as PrismaNode, ProcessParameter as PrismaProcessParameter, DocumentImage as PrismaDocumentImage } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

interface ShareRequestItem {
  email: string;
  shareType: 'IMPLEMENTOR' | 'COLLABORATOR';
  collaboratorRole?: Role; // Only if shareType is COLLABORATOR
  targetUserId: string; // Added after email validation by frontend, or fetched here
}

interface ShareRequestBody {
  shares: ShareRequestItem[];
}

interface ShareParams {
  params: {
    playbookId: string;
  };
}

// Handle CORS preflight requests
export async function OPTIONS(req: Request) {
  const requestOrigin = req.headers.get('origin');
  console.log(`[API Share OPTIONS] Request Origin: ${requestOrigin}`);
  
  const allowedOrigin = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : process.env.NEXT_PUBLIC_APP_URL; // Ensure NEXT_PUBLIC_APP_URL is set in .env for production

  const headers = new Headers();

  if (requestOrigin && (!allowedOrigin || allowedOrigin === requestOrigin)) {
    headers.set('Access-Control-Allow-Origin', requestOrigin);
  } else if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
  }

  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, apikey, x-supabase-auth, baggage, sentry-trace');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  console.log('[API Share OPTIONS] Response Headers to be sent:', JSON.stringify(Object.fromEntries(headers.entries())));

  return new NextResponse(null, { status: 204, headers });
}

async function deepCopyPlaybook(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  originalPlaybookId: string,
  newOwnerId: string,
  authenticatedUserId: string,
  newOwnerEmail: string
): Promise<PrismaPlaybook> {
  const originalPlaybook = await tx.playbook.findUnique({
    where: { id: originalPlaybookId, isDeleted: false },
    include: {
      Process: {
        include: {
          Node: {
            include: {
              ProcessParameter: true,
              DocumentImage: true,
            }
          },
          ProcessParameter: true,
          DocumentImage: true,
        }
      },
      DocumentImage: true, // Playbook-level images
    }
  });

  if (!originalPlaybook) {
    throw new Error('Original playbook not found or has been deleted.');
  }

  const newPlaybookId = crypto.randomUUID();
  const copiedPlaybook = await tx.playbook.create({
    data: {
      id: newPlaybookId,
      name: `${originalPlaybook.name} ${newOwnerEmail} Implementation`,
      ownerId: newOwnerId,
      shortDescription: originalPlaybook.shortDescription,
      documentContent: originalPlaybook.documentContent || undefined,
      status: originalPlaybook.status,
      sourcePlaybookId: originalPlaybook.id,
      updatedAt: new Date(), 
    }
  });

  if (originalPlaybook.DocumentImage.length > 0) {
    await tx.documentImage.createMany({
      data: originalPlaybook.DocumentImage.map(img => ({
        id: crypto.randomUUID(),
        url: img.url, alt: img.alt, caption: img.caption,
        playbookId: copiedPlaybook.id,
      }))
    });
  }

  for (const originalProcess of originalPlaybook.Process) {
    const newProcessId = crypto.randomUUID();
    await tx.process.create({
      data: {
        id: newProcessId,
        name: originalProcess.name,
        playbookId: copiedPlaybook.id,
        shortDescription: originalProcess.shortDescription,
        documentContent: originalProcess.documentContent || undefined,
        bpmnId: originalProcess.bpmnId,
        bpmnXml: originalProcess.bpmnXml,
        updatedAt: new Date(),
      }
    });

    if (originalProcess.DocumentImage.length > 0) {
      await tx.documentImage.createMany({
        data: originalProcess.DocumentImage.map(img => ({
          id: crypto.randomUUID(),
          url: img.url, alt: img.alt, caption: img.caption,
          processId: newProcessId,
        }))
      });
    }
    if (originalProcess.ProcessParameter.length > 0) {
      await tx.processParameter.createMany({
        data: originalProcess.ProcessParameter.map(param => ({
          id: crypto.randomUUID(),
          name: param.name, processId: newProcessId, type: param.type,
          mandatory: param.mandatory, options: param.options,
        }))
      });
    }

    for (const originalNode of originalProcess.Node) {
      const newNodeId = crypto.randomUUID();
      await tx.node.create({
        data: {
          id: newNodeId,
          name: originalNode.name, type: originalNode.type, processId: newProcessId,
          documentContent: originalNode.documentContent || undefined,
          shortDescription: originalNode.shortDescription, bpmnId: originalNode.bpmnId,
          updatedAt: new Date(),
        }
      });

      if (originalNode.DocumentImage.length > 0) {
        await tx.documentImage.createMany({
          data: originalNode.DocumentImage.map(img => ({
            id: crypto.randomUUID(),
            url: img.url, alt: img.alt, caption: img.caption,
            nodeId: newNodeId,
          }))
        });
      }
      if (originalNode.ProcessParameter.length > 0) {
        await tx.processParameter.createMany({
          data: originalNode.ProcessParameter.map(param => ({
            id: crypto.randomUUID(),
            name: param.name, nodeId: newNodeId, type: param.type,
            mandatory: param.mandatory, options: param.options,
          }))
        });
      }
    }
  }

  await tx.playbookShareLog.create({
    data: {
      id: crypto.randomUUID(),
      originalPlaybookId: originalPlaybook.id,
      copiedPlaybookId: copiedPlaybook.id,
      sharedByUserId: authenticatedUserId,
      sharedWithUserId: newOwnerId,
    }
  });
  return copiedPlaybook;
}

export async function POST(req: Request, { params }: ShareParams) {
  const supabase = createClient();
  const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authenticatedUser) {
    console.error('[API Share POST] Authentication error:', authError?.message || 'No authenticated user');
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }
  
  const authenticatedUserId = authenticatedUser.id;
  console.log(`[API Share POST] Authenticated user ID for sharing: ${authenticatedUserId}`);

  console.log('[API Share POST] Request received.');
  
  const incomingHeaders = Object.fromEntries(req.headers.entries());
  console.log('[API Share POST] Incoming Headers:', JSON.stringify(incomingHeaders, null, 2));
  
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    console.log('[API Share POST] Cookie Header found:', cookieHeader);
  } else {
    console.log('[API Share POST] Cookie Header NOT found.');
  }

  const resolvedParams = await params;
  const { playbookId } = resolvedParams;
  console.log(`[API Share POST] Processing share for playbookId: ${playbookId}`);

  try {
    const body: ShareRequestBody = await req.json();
    console.log('[API Share POST] Request body parsed:', JSON.stringify(body, null, 2));
    const { shares } = body;

    const playbook = await prisma.playbook.findUnique({
      where: { id: playbookId, isDeleted: false },
    });

    if (!playbook) {
      console.log(`[API Share POST] Playbook with ID ${playbookId} not found or deleted.`);
      return NextResponse.json({ error: 'Playbook not found or has been deleted' }, { status: 404 });
    }
    console.log(`[API Share POST] Original playbook "${playbook.name}" (ID: ${playbook.id}) found for sharing.`);
    
    if (playbook.ownerId !== authenticatedUserId) {
      console.warn(`[API Share POST] Security Alert: User ${authenticatedUserId} attempted to share playbook ${playbookId} owned by ${playbook.ownerId}.`);
      return NextResponse.json({ error: 'Forbidden: You can only share playbooks you own.' }, { status: 403 });
    }

    const results = [];

    for (const share of shares) {
      console.log(`[API Share POST] Processing share item for email: ${share.email}, type: ${share.shareType}`);
      if (!share.targetUserId) {
        console.log(`[API Share POST] Share item for ${share.email} missing targetUserId.`);
        results.push({ email: share.email, success: false, message: 'Target user ID not provided.' });
        continue;
      }
      if (share.shareType === 'COLLABORATOR') {
        try {
          const collaboratorRole = share.collaboratorRole || Role.COLLABORATOR;
          if (!Object.values(Role).includes(collaboratorRole)) {
            results.push({ email: share.email, success: false, message: `Invalid collaborator role: ${collaboratorRole}` });
            continue;
          }

          const collaborator = await prisma.playbookCollaborator.upsert({
            where: { playbookId_userId: { playbookId, userId: share.targetUserId } }, 
            update: { role: collaboratorRole },
            create: {
              id: crypto.randomUUID(), playbookId, userId: share.targetUserId, role: collaboratorRole, 
            },
          });
          console.log(`[API Share POST] Successfully shared with ${share.email} as ${collaboratorRole.toLowerCase()}. CollabID: ${collaborator.id}`);
          results.push({ email: share.email, success: true, message: `Shared as ${collaboratorRole.toLowerCase()}.`, collaboratorId: collaborator.id });
        } catch (error: any) {
          console.error(`[API Share POST] Error sharing with ${share.email} as collaborator:`, error);
          results.push({ email: share.email, success: false, message: `Error sharing as collaborator: ${error.message}` });
        }
      } else if (share.shareType === 'IMPLEMENTOR') {
        try {
          const copiedPlaybook = await prisma.$transaction(async (tx) => {
            console.log(`[API Share POST] Starting transaction to deep copy playbook for ${share.email}`);
            return deepCopyPlaybook(tx, playbookId, share.targetUserId, authenticatedUserId, share.email); 
          });
          console.log(`[API Share POST] Successfully shared (copied) playbook for ${share.email}. Copied ID: ${copiedPlaybook.id}`);
          results.push({ email: share.email, success: true, message: 'Shared as a copy (Implementor).', copiedPlaybookId: copiedPlaybook.id });
        } catch (error: any) {
          console.error(`[API Share POST] Error sharing (copying) playbook for ${share.email}:`, error);
          results.push({ email: share.email, success: false, message: `Error sharing as copy: ${error.message}` });
        }
      } else {
        console.log(`[API Share POST] Invalid share type "${share.shareType}" for email ${share.email}.`);
        results.push({ email: share.email, success: false, message: `Invalid share type: ${share.shareType}` });
      }
    }
    console.log('[API Share POST] Completed processing all share items. Results:', JSON.stringify(results, null, 2));
    return NextResponse.json({ results }, { status: 200 });

  } catch (error: any) {
    console.error(`[API Share POST] General error processing share for playbook ${playbookId}:`, error);
    return handleApiError(error, `Error processing share for playbook ${playbookId}`);
  }
}
