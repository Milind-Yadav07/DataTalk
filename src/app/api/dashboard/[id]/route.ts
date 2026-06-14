import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '../../../../lib/db/mongoose';
import { DashboardModel } from '../../../../lib/db/models/Dashboard.model';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/dashboard/[id] — get dashboard (public if shareToken matches)
export async function GET(request: Request, context: RouteContext) {
  try {
    await dbConnect();

    const { id } = await context.params;
    const url = new URL(request.url);
    const shareToken = url.searchParams.get('shareToken');

    const dashboard = await DashboardModel.findById(id);
    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    const session = await auth();
    const isOwner = session?.user?.id === dashboard.userId;
    const isPublicMatch = dashboard.isPublic && shareToken && dashboard.shareToken === shareToken;

    if (!isOwner && !isPublicMatch) {
      return NextResponse.json({ error: 'Unauthorized to view this dashboard' }, { status: 401 });
    }

    return NextResponse.json(dashboard);
  } catch (error: any) {
    console.error('Error in GET /api/dashboard/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/dashboard/[id] — update dashboard
export async function PUT(request: Request, context: RouteContext) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;
    const { name, charts, isPublic } = await request.json();

    const dashboard = await DashboardModel.findOne({ _id: id, userId });
    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found or unauthorized' }, { status: 404 });
    }

    if (name !== undefined) dashboard.name = name;
    if (charts !== undefined) dashboard.charts = charts;
    if (isPublic !== undefined) dashboard.isPublic = isPublic;

    await dashboard.save();

    return NextResponse.json(dashboard);
  } catch (error: any) {
    console.error('Error in PUT /api/dashboard/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/dashboard/[id] — delete dashboard
export async function DELETE(request: Request, context: RouteContext) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;

    const dashboard = await DashboardModel.findOneAndDelete({ _id: id, userId });
    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Dashboard deleted successfully.' });
  } catch (error: any) {
    console.error('Error in DELETE /api/dashboard/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
