import { Schema, model, Document, Types } from 'mongoose';

export interface AttendanceDoc extends Document<Types.ObjectId> {
  employeeId: Types.ObjectId;
  date: Date;
  checkIn?: Date | null;
  checkOut?: Date | null;
  duration?: number | null;
}

const AttendanceSchema = new Schema<AttendanceDoc>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true, index: true },
    date: { type: Date, required: true, index: true },
    checkIn: { type: Date, required: false },
    checkOut: { type: Date, required: false },
    duration: { type: Number, required: false }
  },
  { timestamps: true, versionKey: false }
);

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Attendance = model<AttendanceDoc>('Attendance', AttendanceSchema);


