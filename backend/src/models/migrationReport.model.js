/**
 * MigrationReport model
 * Cross-cloud migration plan (AWS→Azure, Azure→GCP, GCP→AWS) with cost, risk,
 * and downtime estimates.
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import {
  PROVIDER_VALUES,
  MIGRATION_STATUS_VALUES,
  MIGRATION_STATUS,
  SEVERITY_VALUES,
  SEVERITY
} from '../config/constants.js';

const { Schema } = mongoose;

const stepSchema = new Schema(
  {
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    estimatedHours: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const migrationReportSchema = createSchema(
  {
    sourceProvider: { type: String, enum: PROVIDER_VALUES, required: true, index: true },
    targetProvider: { type: String, enum: PROVIDER_VALUES, required: true, index: true },
    workloadName: { type: String, trim: true, default: 'workload' },
    status: { type: String, enum: MIGRATION_STATUS_VALUES, default: MIGRATION_STATUS.DRAFT, index: true },
    plan: { type: [stepSchema], default: [] },
    costEstimate: {
      currency: { type: String, default: 'USD' },
      oneTime: { type: Number, default: 0, min: 0 },
      monthlyBefore: { type: Number, default: 0, min: 0 },
      monthlyAfter: { type: Number, default: 0, min: 0 }
    },
    riskLevel: { type: String, enum: SEVERITY_VALUES, default: SEVERITY.MEDIUM },
    riskAssessment: { type: [String], default: [] },
    downtimeEstimateMinutes: { type: Number, default: 0, min: 0 },
    serviceMappings: { type: [{ source: String, target: String, _id: false }], default: [] },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { collection: 'migration_reports' }
);

migrationReportSchema.index({ sourceProvider: 1, targetProvider: 1, createdAt: -1 });

// Source and target must differ
migrationReportSchema.pre('validate', function checkProviders(next) {
  if (this.sourceProvider === this.targetProvider) {
    return next(new Error('sourceProvider and targetProvider must be different'));
  }
  next();
});

const MigrationReport = mongoose.model('MigrationReport', migrationReportSchema);
export default MigrationReport;
