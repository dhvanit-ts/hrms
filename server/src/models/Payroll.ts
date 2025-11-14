import { Schema, model, Document, Types } from 'mongoose';

export interface PayrollDoc extends Document<Types.ObjectId> {
  employeeId: Types.ObjectId;
  salary: number;
  allowances?: number | null;
  deductions?: number | null;
  payDate: Date;
}

const PayrollSchema = new Schema<PayrollDoc>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true, index: true },
    salary: { type: Number, required: true, min: 0 },
    allowances: { type: Number, required: false, min: 0 },
    deductions: { type: Number, required: false, min: 0 },
    payDate: { type: Date, required: true }
  },
  { timestamps: true, versionKey: false }
);

export const Payroll = model<PayrollDoc>('Payroll', PayrollSchema);


