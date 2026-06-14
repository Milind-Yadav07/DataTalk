import { getVectorStore } from './vectorStore';
import type { Row, Column } from '@/types/dataset';

/**
 * Universal retriever — works for any dataset, any query type.
 *
 * Two-stage approach:
 * Stage 1 — Semantic search: finds contextually relevant chunks
 * Stage 2 — Keyword scan: finds exact name/value matches
 *
 * Both results are combined so Gemini always has the right data.
 */
export async function retrieveRelevantContext(
  datasetId: string,
  query: string,
  rows: Row[],
  columns: Column[],
  topK: number = 5
): Promise<string> {

  // ── Stage 1: Semantic similarity search ──────────────────────────
  const vectorStore = await getVectorStore();
  const semanticResults = await vectorStore.similaritySearch(query, topK, {
    preFilter: {
      'metadata.datasetId': { $eq: datasetId },
    },
  });

  const semanticContext = semanticResults
    .map((doc, i) => `[Semantic Match ${i + 1}]:\n${doc.pageContent}`)
    .join('\n\n');

  // ── Stage 2: Keyword scan across all rows ────────────────────────
  // Extract meaningful words from the query (ignore stop words)
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'show', 'give', 'me', 'get',
    'find', 'what', 'who', 'how', 'much', 'many', 'data', 'of',
    'in', 'on', 'at', 'to', 'a', 'an', 'is', 'are', 'was',
    'has', 'have', 'that', 'this', 'from', 'by', 'all', 'their',
  ]);

  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Scan every row for keyword matches in any column
  const keywordMatchedRows: Row[] = [];

  if (queryWords.length > 0) {
    rows.forEach(row => {
      const rowValues = Object.values(row)
        .map(v => String(v ?? '').toLowerCase());

      const matches = queryWords.some(word =>
        rowValues.some(val => val.includes(word))
      );

      if (matches) keywordMatchedRows.push(row);
    });
  }

  // Format keyword-matched rows as readable context
  let keywordContext = '';
  if (keywordMatchedRows.length > 0) {
    const formatted = keywordMatchedRows
      .slice(0, 30) // max 30 rows to avoid token overflow
      .map((row, i) =>
        `Row ${i + 1}: ` +
        columns
          .map(col => `${col.name}=${String(row[col.name] ?? '')}`)
          .join(' | ')
      )
      .join('\n');

    keywordContext = `\n\n[KEYWORD MATCHED ROWS]:\n${formatted}`;
  }

  // ── Combine both contexts ────────────────────────────────────────
  const fullContext = semanticContext + keywordContext;

  return fullContext || 'No specific matching data found. Use schema to generate best possible chart.';
}
