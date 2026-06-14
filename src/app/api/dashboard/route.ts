import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '../../../lib/db/mongoose';
import { DashboardModel } from '../../../lib/db/models/Dashboard.model';

// GET /api/dashboard — list user's dashboards
export async function GET() {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const dashboards = await DashboardModel.find({ userId });

    return NextResponse.json(dashboards);
  } catch (error: any) {
    console.error('Error in GET /api/dashboard:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/dashboard — create dashboard
export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { name, datasetId, datasetName, charts, isPublic } = await request.json();

    if (!name || !datasetId || !datasetName) {
      return NextResponse.json({ error: 'Missing required dashboard fields' }, { status: 400 });
    }

    const newDashboard = await DashboardModel.create({
      userId,
      name,
      datasetId,
      datasetName,
      charts: charts || [],
      isPublic: isPublic ?? false,
    });

    return NextResponse.json(newDashboard, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/dashboard:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
