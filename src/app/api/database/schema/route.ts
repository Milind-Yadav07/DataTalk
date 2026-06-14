import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db/mongoose';
import { DatasetModel } from '@/lib/db/models/Dataset.model';
import { getSchemaAndSample } from '@/lib/db/dbExecutor';
import { encrypt } from '@/lib/utils/encryption';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dbType, connectionString, tableOrCollection, workspaceName } = await request.json();

    if (!dbType || !connectionString || !tableOrCollection) {
      return NextResponse.json({ error: 'Missing required connection details' }, { status: 400 });
    }

    const userId = session.user.id;

    // Fetch schema and 100 sample rows
    const { columns, sampleRows, rowCount } = await getSchemaAndSample(dbType, connectionString, tableOrCollection);

    // Encrypt the connection string
    const encryptedString = encrypt(connectionString);

    const name = workspaceName || `${dbType === 'mongodb' ? 'Mongo' : 'Postgres'}: ${tableOrCollection}`;

    const newDataset = await DatasetModel.create({
      userId,
      name,
      fileName: `Database: ${dbType === 'mongodb' ? 'MongoDB' : 'PostgreSQL'} - ${tableOrCollection}`,
      columns,
      rowCount,
      rows: sampleRows, // Save sample rows for manual visuals / previews
      isIndexed: false, // Not using vector index for live connections
      isDbConnection: true,
      dbType,
      dbConnectionStringEncrypted: encryptedString,
      dbTableOrCollection: tableOrCollection,
    });

    return NextResponse.json({ success: true, datasetId: newDataset.id || newDataset._id });
  } catch (error: any) {
    console.error('Error in POST /api/database/schema:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
