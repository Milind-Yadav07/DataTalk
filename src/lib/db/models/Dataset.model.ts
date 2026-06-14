import mongoose, { Schema, Document } from 'mongoose';

export interface IDataset extends Document {
  name: string;
  fileName: string;
  columns: Array<{
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    sampleValues: string[];
  }>;
  rows: Array<Record<string, any>>;
  rowCount: number;
  userId: string;
  isIndexed: boolean;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  queryHistory?: Array<any>;
  isDbConnection?: boolean;
  dbType?: 'mongodb' | 'postgresql';
  dbConnectionStringEncrypted?: string;
  dbTableOrCollection?: string;
}

const DatasetSchema = new Schema<IDataset>(
  {
    name: { type: String, required: true },
    fileName: { type: String, required: true },
    columns: [
      {
        name: { type: String, required: true },
        type: { type: String, enum: ['string', 'number', 'date', 'boolean'], required: true },
        sampleValues: [{ type: String }],
      },
    ],
    rows: { type: [Schema.Types.Mixed], required: true } as any,
    rowCount: { type: Number, required: true },
    userId: { type: String, required: true, index: true },
    isIndexed: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
    queryHistory: { type: [Schema.Types.Mixed], default: [] },
    isDbConnection: { type: Boolean, default: false },
    dbType: { type: String, enum: ['mongodb', 'postgresql'] },
    dbConnectionStringEncrypted: { type: String },
    dbTableOrCollection: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc: any, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc: any, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const DatasetModel = (mongoose.models.Dataset as mongoose.Model<IDataset>) || mongoose.model<IDataset>('Dataset', DatasetSchema);
