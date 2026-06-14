import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db/mongoose';
import { DatasetModel } from '@/lib/db/models/Dataset.model';
import { decrypt } from '@/lib/utils/encryption';
import { testConnection } from '@/lib/db/dbExecutor';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;

    const dataset = await DatasetModel.findOne({ _id: id, userId });
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    if (!dataset.isDbConnection) {
      return NextResponse.json({ error: 'This workspace is not a database connection' }, { status: 400 });
    }

    if (!dataset.dbConnectionStringEncrypted || !dataset.dbType) {
      return NextResponse.json({ error: 'Database connection details are missing' }, { status: 400 });
    }

    const connectionString = decrypt(dataset.dbConnectionStringEncrypted);
    const collections = await testConnection(dataset.dbType, connectionString);

    return NextResponse.json({ success: true, collections });
  } catch (error: any) {
    console.error('Error in GET /api/dataset/[id]/collections:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
