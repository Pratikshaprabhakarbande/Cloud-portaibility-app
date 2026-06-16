/**
 * CloudResource model
 * Inventory of discovered/managed cloud resources across providers. Used by the
 * dashboard, security scanner, FinOps, and portability analyzer.
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import {
  PROVIDER_VALUES,
  RESOURCE_TYPE_VALUES,
  RESOURCE_STATUS_VALUES,
  RESOURCE_STATUS
} from '../config/constants.js';

const cloudResourceSchema = createSchema(
  {
    resourceId: { type: String, required: true, trim: true }, // provider-native id/ARN
    name: { type: String, trim: true, default: '' },
    provider: { type: String, enum: PROVIDER_VALUES, required: true, index: true },
    region: { type: String, trim: true, default: 'us-east-1', index: true },
    type: { type: String, enum: RESOURCE_TYPE_VALUES, required: true, index: true },
    service: { type: String, trim: true, default: '' }, // e.g. EC2, S3, AKS
    status: { type: String, enum: RESOURCE_STATUS_VALUES, default: RESOURCE_STATUS.UNKNOWN },
    deployment: { type: mongoose.Schema.Types.ObjectId, ref: 'Deployment', default: null },
    tags: { type: Map, of: String, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    monthlyCost: { type: Number, default: 0, min: 0 },
    // Portability hints
    isManaged: { type: Boolean, default: false }, // managed/proprietary service => lock-in risk
    lockInRisk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    lastSyncedAt: { type: Date, default: Date.now }
  },
  { collection: 'cloud_resources' }
);

// A resourceId is unique per provider+region
cloudResourceSchema.index({ provider: 1, region: 1, resourceId: 1 }, { unique: true });
cloudResourceSchema.index({ provider: 1, type: 1, status: 1 });
cloudResourceSchema.index({ lockInRisk: 1 });

const CloudResource = mongoose.model('CloudResource', cloudResourceSchema);
export default CloudResource;
