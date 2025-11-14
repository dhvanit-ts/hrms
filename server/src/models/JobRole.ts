import { Schema, model, Document, Types } from 'mongoose';

export interface JobRoleDoc extends Document<Types.ObjectId> {
  title: string;
  level: number;
  permissions: string[];
}

const JobRoleSchema = new Schema<JobRoleDoc>(
  {
    title: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 1 },
    permissions: { type: [String], default: [] }
  },
  { timestamps: true, versionKey: false }
);

export const JobRole = model<JobRoleDoc>('JobRole', JobRoleSchema);


