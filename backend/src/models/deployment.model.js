/**
 * Deployment model
 * A single deployment action (terraform / docker / kubernetes / manual) to a
 * cloud provider. Supports rollback linkage and version history.
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import {
  PROVIDER_VALUES,
  DEPLOYMENT_TYPE_VALUES,
  DEPLOYMENT_STATUS_VALUES,
  DEPLOYMENT_STATUS,
  PROVIDERS
} from '../config/constants.js';

const deploymentSchema = createSchema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    provider: { type: String, enum: PROVIDER_VALUES, required: true, default: PROVIDERS.AWS, index: true },
    region: { type: String, trim: true, default: 'us-east-1' },
    type: { type: String, enum: DEPLOYMENT_TYPE_VALUES, required: true, index: true },
    status: {
      type: String,
      enum: DEPLOYMENT_STATUS_VALUES,
      default: DEPLOYMENT_STATUS.PENDING,
      index: true
    },
    version: { type: Number, default: 1, min: 1 },
    // Link to the deployment this one rolled back to / replaced
    previousDeployment: { type: mongoose.Schema.Types.ObjectId, ref: 'Deployment', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    artifact: {
      image: { type: String, default: null }, // docker image ref
      repository: { type: String, default: null },
      commitSha: { type: String, default: null }
    },
    config: { type: mongoose.Schema.Types.Mixed, default: {} }, // terraform vars / env
    durationMs: { type: Number, default: 0, min: 0 },
    logsRef: { type: String, default: null }, // pointer to log storage / container id
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
    isRollbackable: { type: Boolean, default: true }
  },
  { collection: 'deployments' }
);

// ---- Indexes (query patterns: history, filters, trends) ----
deploymentSchema.index({ provider: 1, status: 1, createdAt: -1 });
deploymentSchema.index({ user: 1, createdAt: -1 });
deploymentSchema.index({ name: 'text' });

// ---- Virtuals ----
deploymentSchema.virtual('isActive').get(function isActive() {
  return [DEPLOYMENT_STATUS.SUCCESS, DEPLOYMENT_STATUS.IN_PROGRESS].includes(this.status);
});

const Deployment = mongoose.model('Deployment', deploymentSchema);
export default Deployment;
