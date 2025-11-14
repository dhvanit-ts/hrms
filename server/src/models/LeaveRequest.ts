import { Schema, model, Document, Types } from 'mongoose';

export interface LeaveRequestDoc extends Document<Types.ObjectId> {
  employeeId: Types.ObjectId;
  type: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  approverId?: Types.ObjectId | null;
  reason?: string | null;
  createdAt: Date;
}

const LeaveRequestSchema = new Schema<LeaveRequestDoc>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approverId: { type: Schema.Types.ObjectId, required: false },
    reason: { type: String, required: false }
  },
  { timestamps: { createdAt: true, updatedAt: true }, versionKey: false }
);

export const LeaveRequest = model<LeaveRequestDoc>('LeaveRequest', LeaveRequestSchema);


