import { chunkDataset } from './chunker';
import { buildAndPersistVectorStore } from './vectorStore';
import { retrieveRelevantContext } from './retriever';
import { generateChartConfig } from '../langchain';
import { dbConnect } from '@/lib/db/mongoose';
import { DatasetModel } from '@/lib/db/models/Dataset.model';
import type { Column, Row } from '@/types/dataset';
import type { ChartConfig } from '@/types/chart';

export interface RAGQueryResult {
  chartConfig: ChartConfig;
  retrievedContext: string;
}

export async function runRAGQuery(
  datasetId: string,
  columns: Column[],
  rows: Row[],
  query: string
): Promise<RAGQueryResult> {

  let contextText = '';

  if (rows.length <= 500) {
    // ── Small dataset: skip RAG, send all rows directly ──────────
    // More accurate for small files, no chunking/embedding needed
    contextText = rows
      .map(
        (row, i) =>
          `Row ${i + 1}: ` +
          columns
            .map(col => `${col.name}=${String(row[col.name] ?? '')}`)
            .join(' | ')
      )
      .join('\n');

  } else {
    // ── Large dataset: full RAG pipeline ─────────────────────────
    await dbConnect();
    const dataset = await DatasetModel.findById(datasetId).select('isIndexed');
    if (!dataset) throw new Error(`Dataset ${datasetId} not found`);

    if (!dataset.isIndexed) {
      const chunks = chunkDataset(rows, datasetId, 50);
      await buildAndPersistVectorStore(datasetId, chunks);
      await DatasetModel.findByIdAndUpdate(datasetId, { isIndexed: true });
    }

    // Two-stage retrieval: semantic + keyword
    contextText = await retrieveRelevantContext(
      datasetId,
      query,
      rows,
      columns,
      5
    );
  }

  const chartConfig = await generateChartConfig(query, columns, contextText);
  return { chartConfig, retrievedContext: contextText };
}
