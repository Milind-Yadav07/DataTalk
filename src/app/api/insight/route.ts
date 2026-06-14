import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '../../../lib/db/mongoose';
import { generateInsight, generateDbAnalysisSummary } from '../../../lib/ai/langchain';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chartConfig, data, query, isDbConnection } = await request.json();

    if (!data || !query) {
      return NextResponse.json({ error: 'Missing data or query' }, { status: 400 });
    }

    let insight = '';
    if (isDbConnection) {
      insight = await generateDbAnalysisSummary(query, data);
    } else {
      if (!chartConfig) {
        return NextResponse.json({ error: 'Missing chartConfig for chart insight' }, { status: 400 });
      }
      insight = await generateInsight(query, chartConfig, data);
    }

    return NextResponse.json({ insight });
  } catch (error: any) {
    console.error('Error in POST /api/insight:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

