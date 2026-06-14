import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'crypto';

export interface IDashboard extends Document {
  userId: string;
  name: string;
  datasetId: string;
  datasetName: string;
  charts: Array<any>;
  isPublic: boolean;
  shareToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const DashboardSchema = new Schema<IDashboard>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    datasetId: { type: String, required: true },
    datasetName: { type: String, required: true },
    charts: { type: [Schema.Types.Mixed], default: [] } as any,
    isPublic: { type: Boolean, default: false },
    shareToken: {
      type: String,
      unique: true,
      default: () => randomUUID(),
    },
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

export const DashboardModel = (mongoose.models.Dashboard as mongoose.Model<IDashboard>) || mongoose.model<IDashboard>('Dashboard', DashboardSchema);
