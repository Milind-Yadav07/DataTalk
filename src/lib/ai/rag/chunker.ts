import type { Row } from '../../../types/dataset';

export interface DataChunk {
  text: string;
  metadata: {
    datasetId: string;
    startIndex: number;
    endIndex: number;
  };
}

/**
 * Splits Row[] into DataChunk[] of 50 rows each.
 * Each row is formatted as a single line: "col1=val1 | col2=val2 | ..."
 * All formatted rows within a chunk are concatenated with newlines.
 */
export function chunkDataset(rows: Row[], datasetId: string, chunkSize: number = 50): DataChunk[] {
  const chunks: DataChunk[] = [];
  
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    
    const formattedRows = slice.map((row) => {
      return Object.entries(row)
        .map(([colName, value]) => `${colName}=${value !== null && value !== undefined ? value : ''}`)
        .join(' | ');
    });
    
    chunks.push({
      text: formattedRows.join('\n'),
      metadata: {
        datasetId,
        startIndex: i,
        endIndex: i + slice.length - 1,
      },
    });
  }
  
  return chunks;
}
