import { Schema, model, Document, Types } from 'mongoose';

export interface DepartmentDoc extends Document<Types.ObjectId> {
  name: string;
  managerId?: Types.ObjectId | null;
}

const DepartmentSchema = new Schema<DepartmentDoc>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    managerId: { type: Schema.Types.ObjectId, required: false }
  },
  { timestamps: true, versionKey: false }
);

export const Department = model<DepartmentDoc>('Department', DepartmentSchema);


