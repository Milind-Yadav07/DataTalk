import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '../../../../lib/db/mongoose';
import { DatasetModel } from '../../../../lib/db/models/Dataset.model';
import { DashboardModel } from '../../../../lib/db/models/Dashboard.model';
import { QueryLogModel } from '../../../../lib/db/models/QueryLog.model';
import { deleteVectorsByDatasetId } from '../../../../lib/ai/rag/vectorStore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/dataset/[id] — get single dataset
export async function GET(request: Request, context: RouteContext) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;

    const dataset = await DatasetModel.findOne({ _id: id, userId }).select('-dbConnectionStringEncrypted');
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    return NextResponse.json(dataset);
  } catch (error: any) {
    console.error('Error in GET /api/dataset/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/dataset/[id] — delete dataset + its vectors from Atlas
export async function DELETE(request: Request, context: RouteContext) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;

    // Verify ownership and delete the dataset
    const dataset = await DatasetModel.findOneAndDelete({ _id: id, userId });
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found or unauthorized' }, { status: 404 });
    }

    // Purge associated vectors from the vectors collection in Atlas
    await deleteVectorsByDatasetId(id);

    // Purge associated dashboards and query logs from MongoDB database
    await DashboardModel.deleteMany({ datasetId: id, userId });
    await QueryLogModel.deleteMany({ datasetId: id, userId });

    return NextResponse.json({ success: true, message: 'Dataset and associated vector embeddings deleted successfully.' });
  } catch (error: any) {
    console.error('Error in DELETE /api/dataset/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/dataset/[id] — update dataset properties (like queryHistory)
export async function PATCH(request: Request, context: RouteContext) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;

    const { queryHistory } = await request.json();

    const dataset = await DatasetModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { queryHistory } },
      { new: true }
    ).select('-dbConnectionStringEncrypted');

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Dataset history updated successfully.' });
  } catch (error: any) {
    console.error('Error in PATCH /api/dataset/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
