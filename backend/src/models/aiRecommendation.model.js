/**
 * AIRecommendation model
 * Persisted AI output from the Cloud Architect / optimization / security advice
 * flows (Amazon Bedrock / Claude, with mock fallback).
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import {
  RECOMMENDATION_TYPE_VALUES,
  AI_SOURCE_VALUES,
  AI_SOURCES,
  PROVIDER_VALUES
} from '../config/constants.js';

const { Schema } = mongoose;

const aiRecommendationSchema = createSchema(
  {
    type: { type: String, enum: RECOMMENDATION_TYPE_VALUES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    // Original user inputs (budget, region, expected users, app type, scalability)
    inputs: { type: Schema.Types.Mixed, default: {} },
    // For architecture recommendations: per-provider design blocks
    architectures: {
      aws: { type: Schema.Types.Mixed, default: null },
      azure: { type: Schema.Types.Mixed, default: null },
      gcp: { type: Schema.Types.Mixed, default: null }
    },
    targetProvider: { type: String, enum: PROVIDER_VALUES, default: null },
    content: { type: String, default: '' }, // markdown / narrative
    costEstimate: { type: Schema.Types.Mixed, default: null },
    securityRecommendations: { type: [String], default: [] },
    scalabilityRecommendations: { type: [String], default: [] },
    aiSource: { type: String, enum: AI_SOURCE_VALUES, default: AI_SOURCES.MOCK, index: true },
    model: { type: String, default: null }, // model id used
    tokensUsed: { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { collection: 'ai_recommendations' }
);

aiRecommendationSchema.index({ type: 1, createdAt: -1 });
aiRecommendationSchema.index({ user: 1, type: 1 });

const AIRecommendation = mongoose.model('AIRecommendation', aiRecommendationSchema);
export default AIRecommendation;
