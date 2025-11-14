import { Schema, model, Document } from 'mongoose';

export interface AuditLogDoc extends Document {
  action: string;
  entity: string;
  entityId: string;
  performedBy?: string | null;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    performedBy: { type: String, required: false },
    timestamp: { type: Date, default: () => new Date() },
    metadata: { type: Schema.Types.Mixed, required: false }
  },
  { timestamps: false, versionKey: false }
);

export const AuditLog = model<AuditLogDoc>('AuditLog', AuditLogSchema);


