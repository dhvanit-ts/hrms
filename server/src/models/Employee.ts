import { Schema, model, Document, Types } from 'mongoose';

export interface EmployeeDoc extends Document<Types.ObjectId> {
  employeeId: string;
  name: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
  departmentId?: Types.ObjectId | null;
  jobRoleId?: Types.ObjectId | null;
  hireDate?: Date | null;
  status: 'active' | 'inactive' | 'terminated';
  payrollRef?: Types.ObjectId | null;
}

const EmployeeSchema = new Schema<EmployeeDoc>(
  {
    employeeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: false },
    dateOfBirth: { type: Date, required: false },
    departmentId: { type: Schema.Types.ObjectId, required: false },
    jobRoleId: { type: Schema.Types.ObjectId, required: false },
    hireDate: { type: Date, required: false },
    status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
    payrollRef: { type: Schema.Types.ObjectId, required: false }
  },
  { timestamps: true, versionKey: false }
);

export const Employee = model<EmployeeDoc>('Employee', EmployeeSchema);


