/**
 * CostReport model
 * FinOps snapshot: daily/monthly/projected cost per provider with optimization
 * recommendations and savings opportunities.
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import { PROVIDER_VALUES, CURRENCIES } from '../config/constants.js';

const { Schema } = mongoose;

const serviceBreakdownSchema = new Schema(
  {
    service: { type: String, required: true },
    cost: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 }
  },
  { _id: false }
);

const recommendationSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    estimatedMonthlySavings: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const costReportSchema = createSchema(
  {
    provider: { type: String, enum: PROVIDER_VALUES, required: true, index: true },
    currency: { type: String, enum: CURRENCIES, default: 'USD' },
    period: {
      // ISO date for the day this snapshot represents
      date: { type: Date, default: Date.now, index: true },
      month: { type: String, default: () => new Date().toISOString().slice(0, 7) } // YYYY-MM
    },
    dailyCost: { type: Number, default: 0, min: 0 },
    monthlyCost: { type: Number, default: 0, min: 0 },
    projectedCost: { type: Number, default: 0, min: 0 },
    breakdown: { type: [serviceBreakdownSchema], default: [] },
    recommendations: { type: [recommendationSchema], default: [] },
    totalPotentialSavings: { type: Number, default: 0, min: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { collection: 'cost_reports' }
);

costReportSchema.index({ provider: 1, 'period.date': -1 });
costReportSchema.index({ 'period.month': 1, provider: 1 });

costReportSchema.pre('save', function sumSavings(next) {
  this.totalPotentialSavings = (this.recommendations || []).reduce(
    (sum, r) => sum + (r.estimatedMonthlySavings || 0),
    0
  );
  next();
});

const CostReport = mongoose.model('CostReport', costReportSchema);
export default CostReport;
