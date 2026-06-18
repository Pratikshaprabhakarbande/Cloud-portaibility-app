/**
 * SecurityReport model
 * Output of the Security Center scan and the Adversarial Security Lab.
 * Stores individual findings plus aggregate security/risk scores.
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import { PROVIDER_VALUES, SEVERITY_VALUES, SEVERITY } from '../config/constants.js';

const { Schema } = mongoose;

const findingSchema = new Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['open_ports', 'public_bucket', 'weak_iam', 'security_group', 'misconfiguration', 'excessive_permissions'],
      required: true
    },
    severity: { type: String, enum: SEVERITY_VALUES, default: SEVERITY.MEDIUM },
    resourceId: { type: String, default: null },
    description: { type: String, default: '' },
    recommendation: { type: String, default: '' }
  },
  { _id: false }
);

const securityReportSchema = createSchema(
  {
    provider: { type: String, enum: PROVIDER_VALUES, required: true, index: true },
    region: { type: String, default: 'us-east-1' },
    scanType: { type: String, enum: ['scan', 'adversarial'], default: 'scan', index: true },
    findings: { type: [findingSchema], default: [] },
    // 0-100, higher is better
    securityScore: { type: Number, min: 0, max: 100, default: 100 },
    // 0-100, higher is worse
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    summary: {
      total: { type: Number, default: 0 },
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 }
    },
    recommendations: { type: [String], default: [] },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { collection: 'security_reports' }
);

securityReportSchema.index({ provider: 1, createdAt: -1 });
securityReportSchema.index({ riskScore: -1 });

// Recompute summary counts from findings before save
securityReportSchema.pre('save', function computeSummary(next) {
  const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of this.findings) {
    counts.total += 1;
    if (counts[f.severity] !== undefined) counts[f.severity] += 1;
  }
  this.summary = counts;
  next();
});

const SecurityReport = mongoose.model('SecurityReport', securityReportSchema);
export default SecurityReport;
