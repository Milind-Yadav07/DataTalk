import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '../../../lib/db/mongoose';
import { QueryLogModel } from '../../../lib/db/models/QueryLog.model';
import { DatasetModel } from '../../../lib/db/models/Dataset.model';
import { runRAGQuery } from '../../../lib/ai/rag/ragPipeline';
import { generateChartConfig, generateDbQuery } from '../../../lib/ai/langchain';
import { transformDataForChart } from '../../../lib/utils/dataTransform';
import { decrypt } from '../../../lib/utils/encryption';
import { runQuery } from '../../../lib/db/dbExecutor';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { query, schema, datasetId, rows } = await request.json();
    
    if (!query || !datasetId) {
      return NextResponse.json({ error: 'Missing query or datasetId' }, { status: 400 });
    }

    let chartConfig = null;
    let retrievedContext = '';
    let success = false;
    let error: string | null = null;
    let responseRows: any[] | null = null;

    // Check if dataset exists and is a database connection
    const dataset = await DatasetModel.findOne({ _id: datasetId, userId });
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    if (dataset.isDbConnection) {
      // Live database query flow
      try {
        if (!dataset.dbConnectionStringEncrypted || !dataset.dbType || !dataset.dbTableOrCollection) {
          throw new Error('Database connection details are missing or corrupt.');
        }

        const connectionString = decrypt(dataset.dbConnectionStringEncrypted);

        // 1. Generate query & chart details via Gemini
        const aiResponse = await generateDbQuery(
          dataset.dbType,
          dataset.dbTableOrCollection,
          dataset.columns,
          query
        );

        if (!aiResponse.queryExists) {
          throw new Error(aiResponse.errorReason || 'The AI was unable to generate a valid query for this question.');
        }

        // 2. Run query on database
        const queryResults = await runQuery(
          dataset.dbType,
          connectionString,
          dataset.dbTableOrCollection,
          aiResponse.query
        );

        success = true;
        chartConfig = {
          id: `db_chart_${Math.random().toString(36).substring(2, 11)}`,
          chartType: aiResponse.chartType,
          title: aiResponse.title,
          xAxis: aiResponse.xAxis,
          yAxis: aiResponse.yAxis,
        };
        responseRows = queryResults;
        retrievedContext = `Generated ${dataset.dbType === 'mongodb' ? 'MongoDB pipeline' : 'SQL query'}:\n${aiResponse.query}`;
      } catch (err: any) {
        success = false;
        chartConfig = null;
        retrievedContext = '';
        error = err.message || 'An error occurred during database query execution.';
      }
    } else {
      // Standard CSV dataset flow
      if (rows && (!dataset.rows || dataset.rows.length === 0)) {
        dataset.rows = rows;
        dataset.rowCount = rows.length;
        await dataset.save();
      }

      const hasRows = (rows && rows.length > 0) || (dataset.rows && dataset.rows.length > 0);

      if (hasRows) {
        // Calls RAG pipeline
        try {
          const datasetRows = dataset.rows || rows || [];
          const datasetColumns = dataset.columns || schema || [];
          const result = await runRAGQuery(datasetId, datasetColumns, datasetRows, query);
          success = true;
          chartConfig = result.chartConfig;
          retrievedContext = result.retrievedContext;
          error = null;
        } catch (err: any) {
          success = false;
          chartConfig = null;
          retrievedContext = '';
          error = err.message || 'An error occurred in RAG pipeline';
        }
      } else {
        // Falls back to schema-only config generation
        chartConfig = await generateChartConfig(query, schema || [], '');
        success = true;
        retrievedContext = '';
      }
    }

    // Intercept and validate relevance / empty data
    if (success && chartConfig) {
      const configAny = chartConfig as any;
      if (configAny.dataExists === false) {
        success = false;
        error = configAny.errorReason || 'this data is not there in dataset';
      } else {
        const datasetRows = responseRows || dataset.rows || rows || [];
        if (datasetRows.length > 0) {
          const transformed = transformDataForChart(datasetRows, chartConfig as any);
          if (transformed.length === 0) {
            success = false;
            error = 'this data is not there in dataset';
          }
        }
      }
    }

    // Save QueryLog to MongoDB
    if (success && chartConfig) {
      await QueryLogModel.create({
        userId,
        datasetId,
        query,
        chartConfigId: chartConfig.id,
      });
    }

    return NextResponse.json({
      success,
      chartConfig,
      retrievedContext,
      error,
      rows: responseRows || undefined,
    });
  } catch (error: any) {
    console.error('Error in POST /api/query:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
