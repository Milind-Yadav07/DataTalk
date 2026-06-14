import type { ChartConfig } from './chart';

export interface Dashboard {
  id: string;
  userId: string;
  name: string;
  datasetId: string;
  datasetName: string;
  charts: ChartConfig[];
  isPublic: boolean;
  shareToken: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
