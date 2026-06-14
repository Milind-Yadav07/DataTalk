import type { Row } from './dataset';

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter';

export interface ChartConfig {
  id: string;
  chartType: ChartType;
  title: string;
  xAxis: string;
  yAxis: string | string[];
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  filters?: ChartFilter[];
  sortBy?: 'asc' | 'desc';
  limit?: number;
  color?: string[];
}

export interface ChartFilter {
  column: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_eq' | 'between';
  value: string | number | [number, number];
}

export interface ChartData {
  config: ChartConfig;
  data: Row[];
  insight?: string;
  query: string;
  generatedAt: Date;
}
