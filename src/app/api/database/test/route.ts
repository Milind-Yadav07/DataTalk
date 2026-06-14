import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { testConnection } from '@/lib/db/dbExecutor';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dbType, connectionString } = await request.json();

    if (!dbType || !connectionString) {
      return NextResponse.json({ error: 'Missing dbType or connectionString' }, { status: 400 });
    }

    const items = await testConnection(dbType, connectionString);
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Error in POST /api/database/test:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
