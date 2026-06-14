import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db/mongoose';
import { DatasetModel } from '@/lib/db/models/Dataset.model';
import { decrypt } from '@/lib/utils/encryption';
import { getSchemaAndSample } from '@/lib/db/dbExecutor';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;
    const { collection } = await request.json();

    if (!collection) {
      return NextResponse.json({ error: 'Missing collection name' }, { status: 400 });
    }

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

    // Fetch schema and 100 sample rows for the new collection/table
    const { columns, sampleRows, rowCount } = await getSchemaAndSample(
      dataset.dbType,
      connectionString,
      collection
    );

    // Update the dataset properties
    dataset.dbTableOrCollection = collection;
    dataset.columns = columns;
    dataset.rows = sampleRows;
    dataset.rowCount = rowCount;
    dataset.name = `${dataset.dbType === 'mongodb' ? 'Mongo' : 'Postgres'}: ${collection}`;
    dataset.fileName = `Database: ${dataset.dbType === 'mongodb' ? 'MongoDB' : 'PostgreSQL'} - ${collection}`;

    await dataset.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/dataset/[id]/switch-collection:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
