import mongoose, { Schema, Document } from 'mongoose';

export interface IReportDocument extends Document {
  targetType: 'post' | 'user';
  targetId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
}

const ReportSchema = new Schema<IReportDocument>(
  {
    targetType: { type: String, enum: ['post', 'user'], required: true },
    targetId: { type: String, required: true },
    reporterId: { type: String, required: true },
    reporterName: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  },
  { timestamps: true }
);

export const ReportModel = mongoose.models.Report || mongoose.model<IReportDocument>('Report', ReportSchema);
