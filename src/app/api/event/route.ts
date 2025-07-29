import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';
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

export async function GET(req:Request) {
    try {
        const user = await requireUser();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId') || user.id;

        const events = await prisma.event.findMany({
            where: {
                ownerId: userId,
            },
        });

        return NextResponse.json(events);
    } catch (error: any) {
        if (error.message === 'User not authenticated') {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }
        return handleApiError(error, 'Failed to fetch events');
    }
}

export async function POST(req:Request){
    try{
        const user = await requireUser();
        const body = await req.json();
        console.log(body);
        const {name, description, playbookId, currentProcessId, parameters} = body;

        if (!name) {
            return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
        }
        if (!playbookId) {
            return NextResponse.json({ error: 'Playbook ID is required' }, { status: 400 });
        }
        if (!currentProcessId) {
            return NextResponse.json({ error: 'Current Process ID is required' }, { status: 400 });
        }

        const event = await prisma.event.create({
            data:{
                // id is defaulted to uuid() by schema
                name: name,
                description: description,
                ownerId: user.id,
                playbookId: playbookId,
                currentProcessId: currentProcessId,
                parameters: parameters || [],
                status: Status.PLANNING,
                // Playbook and Process relations are established by foreign keys playbookId and currentProcessId
            }
        });
        return NextResponse.json(event, { status: 201 });

    } catch (error: any) {
        if (error.message === 'User not authenticated') {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }
        return handleApiError(error, 'Failed to create event');
    }
}