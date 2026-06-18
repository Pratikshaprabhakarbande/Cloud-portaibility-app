/**
 * AuditLog model
 * Immutable trail of security-relevant actions (login, deploy, rollback, etc.).
 *
 * Audit logs are append-only: soft delete and audit/ownership fields are
 * disabled, and updates are blocked at the model level.
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import { AUDIT_ACTION_VALUES, ROLE_VALUES } from '../config/constants.js';

const { Schema } = mongoose;

const auditLogSchema = createSchema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorEmail: { type: String, default: null }, // denormalized for retention
    actorRole: { type: String, enum: ROLE_VALUES, default: null },
    action: { type: String, enum: AUDIT_ACTION_VALUES, required: true, index: true },
    entityType: { type: String, default: null, index: true }, // e.g. 'Deployment'
    entityId: { type: String, default: null },
    description: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    success: { type: Boolean, default: true }
  },
  { collection: 'audit_logs' },
  { audit: false, softDelete: false } // append-only
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
// TTL: auto-expire audit logs after 365 days (retention policy)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Block updates to keep the trail immutable
auditLogSchema.pre('findOneAndUpdate', function blockUpdate(next) {
  next(new Error('Audit logs are immutable and cannot be updated'));
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
