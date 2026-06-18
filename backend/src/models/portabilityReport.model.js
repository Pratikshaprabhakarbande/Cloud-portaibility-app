/**
 * PortabilityReport model
 * Vendor lock-in analysis and portability scoring for a given provider/workload.
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import { PROVIDER_VALUES } from '../config/constants.js';

const { Schema } = mongoose;

const dependencySchema = new Schema(
  {
    service: { type: String, required: true }, // e.g. DynamoDB, Cosmos DB
    category: { type: String, default: 'other' },
    lockInRisk: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    portableAlternative: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  { _id: false }
);

const portabilityReportSchema = createSchema(
  {
    provider: { type: String, enum: PROVIDER_VALUES, required: true, index: true },
    workloadName: { type: String, trim: true, default: 'workload' },
    dependencies: { type: [dependencySchema], default: [] },
    // 0-100, higher = more portable
    portabilityScore: { type: Number, min: 0, max: 100, default: 0 },
    lockInRisks: { type: [String], default: [] },
    migrationRecommendations: { type: [String], default: [] },
    summary: { type: String, default: '' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { collection: 'portability_reports' }
);

portabilityReportSchema.index({ provider: 1, createdAt: -1 });
portabilityReportSchema.index({ portabilityScore: -1 });

const PortabilityReport = mongoose.model('PortabilityReport', portabilityReportSchema);
export default PortabilityReport;
