import mongoose, { Schema, Document } from 'mongoose';

export interface IQueryLog extends Document {
  userId: string;
  datasetId: string;
  query: string;
  chartConfigId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QueryLogSchema = new Schema<IQueryLog>(
  {
    userId: { type: String, required: true },
    datasetId: { type: String, required: true },
    query: { type: String, required: true },
    chartConfigId: { type: String },
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

// Add compound index on userId + datasetId
QueryLogSchema.index({ userId: 1, datasetId: 1 });

export const QueryLogModel = (mongoose.models.QueryLog as mongoose.Model<IQueryLog>) || mongoose.model<IQueryLog>('QueryLog', QueryLogSchema);
