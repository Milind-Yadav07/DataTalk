import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '../../../lib/db/mongoose';
import { DatasetModel } from '../../../lib/db/models/Dataset.model';

// GET /api/dataset — list user's datasets
export async function GET() {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    // Find all datasets for the user, excluding rows array and encrypted credentials to keep payload size optimal and secure
    const datasets = await DatasetModel.find({ userId }).select('-rows -dbConnectionStringEncrypted');

    return NextResponse.json(datasets);
  } catch (error: any) {
    console.error('Error in GET /api/dataset:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/dataset — save dataset metadata (isIndexed: false)
export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { name, fileName, columns, rowCount, rows } = await request.json();

    if (!name || !fileName || !columns || rowCount === undefined) {
      return NextResponse.json({ error: 'Missing required dataset metadata fields' }, { status: 400 });
    }

    const newDataset = await DatasetModel.create({
      userId,
      name,
      fileName,
      columns,
      rowCount,
      rows: rows || [],
      isIndexed: false, // CRITICAL: starts as false until first query indexes it
    });

    return NextResponse.json(newDataset, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/dataset:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
