import type { Column, Row } from './dataset';
import type { ChartConfig } from './chart';

export interface QueryRequest {
  query: string;
  schema: Column[];
  datasetId: string;
  rows?: Row[];
}

export interface QueryResponse {
  success: boolean;
  chartConfig?: ChartConfig;
  retrievedContext?: string;
  error?: string;
}

export interface InsightRequest {
  chartConfig: ChartConfig;
  data: Row[];
  query: string;
}

export interface InsightResponse {
  insight: string;
}
