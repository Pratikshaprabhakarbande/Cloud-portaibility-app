/**
 * ComplianceReport model
 * Result of running a compliance framework (CIS, NIST, etc.) against a provider.
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import {
  PROVIDER_VALUES,
  COMPLIANCE_FRAMEWORK_VALUES,
  CHECK_STATUS_VALUES,
  CHECK_STATUS,
  SEVERITY_VALUES,
  SEVERITY
} from '../config/constants.js';

const { Schema } = mongoose;

const controlSchema = new Schema(
  {
    controlId: { type: String, required: true }, // e.g. CIS 1.1
    title: { type: String, required: true },
    status: { type: String, enum: CHECK_STATUS_VALUES, default: CHECK_STATUS.PASS },
    severity: { type: String, enum: SEVERITY_VALUES, default: SEVERITY.MEDIUM },
    remediation: { type: String, default: '' }
  },
  { _id: false }
);

const complianceReportSchema = createSchema(
  {
    provider: { type: String, enum: PROVIDER_VALUES, required: true, index: true },
    framework: { type: String, enum: COMPLIANCE_FRAMEWORK_VALUES, required: true, index: true },
    controls: { type: [controlSchema], default: [] },
    complianceScore: { type: Number, min: 0, max: 100, default: 0 },
    summary: {
      total: { type: Number, default: 0 },
      passed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      warnings: { type: Number, default: 0 }
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { collection: 'compliance_reports' }
);

complianceReportSchema.index({ provider: 1, framework: 1, createdAt: -1 });

complianceReportSchema.pre('save', function computeScore(next) {
  const s = { total: 0, passed: 0, failed: 0, warnings: 0 };
  for (const c of this.controls) {
    s.total += 1;
    if (c.status === CHECK_STATUS.PASS) s.passed += 1;
    else if (c.status === CHECK_STATUS.FAIL) s.failed += 1;
    else if (c.status === CHECK_STATUS.WARN) s.warnings += 1;
  }
  this.summary = s;
  this.complianceScore = s.total ? Math.round((s.passed / s.total) * 100) : 0;
  next();
});

const ComplianceReport = mongoose.model('ComplianceReport', complianceReportSchema);
export default ComplianceReport;
