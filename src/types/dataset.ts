export type ColumnType = 'string' | 'number' | 'date' | 'boolean';

export interface Column {
  name: string;
  type: ColumnType;
  sampleValues: string[];
}

export interface Row {
  [key: string]: string | number | boolean | null;
}

export interface Dataset {
  id: string;
  name: string;
  fileName: string;
  columns: Column[];
  rows: Row[];
  rowCount: number;
  uploadedAt: Date | string;
  userId: string;
  isIndexed: boolean;
  isDbConnection?: boolean;
  dbType?: 'mongodb' | 'postgresql';
  dbTableOrCollection?: string;
}

export interface DatasetMeta {
  id: string;
  name: string;
  fileName: string;
  rowCount: number;
  columns: Column[];
  uploadedAt: Date | string;
  isIndexed: boolean;
  isDbConnection?: boolean;
  dbType?: 'mongodb' | 'postgresql';
  dbTableOrCollection?: string;
}
