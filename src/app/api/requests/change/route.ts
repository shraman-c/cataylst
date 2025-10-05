
import { NextRequest, NextResponse } from 'next/server';
import { getAll, insert, update } from '@/server/neon';
import { ChangeRequestSchema, UpdateChangeRequestSchema } from '@/lib/data-schemas';

async function getRequests() {
  try {
    // Get from Neon database only
    const data = await getAll('change_requests');
    return data || [];
  } catch (error) {
    console.error('Error getting change requests:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
    try {
        let body;
        try {
            body = await req.json();
        } catch(e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const parsedData = ChangeRequestSchema.omit({ _id: true, createdAt: true, status: true }).safeParse(body);
        if (!parsedData.success) {
            return NextResponse.json({ error: 'Invalid input data', details: parsedData.error.flatten() }, { status: 400 });
        }
        
        const customId = `req-${Date.now()}`;
        const newRequest = {
            custom_id: customId,
            requester_id: parsedData.data.requesterId,
            requester_name: parsedData.data.requesterName,
            slot_id: parsedData.data.slotId,
            request_details: parsedData.data.requestDetails,
            status: 'pending',
        };

        const result = await insert('change_requests', newRequest);

        return NextResponse.json({ success: true, id: result.custom_id }, { status: 201 });

    } catch (error: any) {
        console.error("Failed to create change request:", error);
        return NextResponse.json({ error: 'Failed to create change request' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const requests = await getRequests();
        
        // Transform database format to API format
        const transformedRequests = requests.map((req: any) => ({
            _id: req.custom_id,
            requesterId: req.requester_id,
            requesterName: req.requester_name,
            slotId: req.slot_id,
            requestDetails: req.request_details,
            status: req.status,
            createdAt: req.created_at,
        }));
        
        // Sort by date descending
        transformedRequests.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return NextResponse.json(transformedRequests);
    } catch (error) {
        console.error("Failed to fetch change requests:", error);
        return NextResponse.json({ error: 'Failed to fetch change requests' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Valid request ID is required' }, { status: 400 });
        }

        let body;
        try {
            body = await req.json();
        } catch(e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        
        const parsedData = UpdateChangeRequestSchema.safeParse(body);
        if (!parsedData.success) {
            return NextResponse.json({ error: 'Invalid input data', details: parsedData.error.flatten() }, { status: 400 });
        }
        
        const { status } = parsedData.data;

        const result = await update('change_requests', id, { status });

        if (!result) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Failed to update change request:", error);
        return NextResponse.json({ error: 'Failed to update change request' }, { status: 500 });
    }
}
