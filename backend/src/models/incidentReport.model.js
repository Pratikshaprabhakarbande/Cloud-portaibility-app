/**
 * IncidentReport model
 * AI Incident Analyzer output: root cause, severity, suggested fix, lifecycle.
 */
import mongoose from 'mongoose';
import { createSchema } from './baseSchema.js';
import {
  PROVIDER_VALUES,
  SEVERITY_VALUES,
  SEVERITY,
  INCIDENT_STATUS_VALUES,
  INCIDENT_STATUS,
  AI_SOURCE_VALUES,
  AI_SOURCES
} from '../config/constants.js';

const { Schema } = mongoose;

const incidentReportSchema = createSchema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    provider: { type: String, enum: PROVIDER_VALUES, default: null, index: true },
    severity: { type: String, enum: SEVERITY_VALUES, default: SEVERITY.MEDIUM, index: true },
    status: { type: String, enum: INCIDENT_STATUS_VALUES, default: INCIDENT_STATUS.OPEN, index: true },
    inputs: {
      logs: { type: String, default: '' },
      errors: { type: String, default: '' },
      alerts: { type: String, default: '' }
    },
    rootCause: { type: String, default: '' },
    suggestedFix: { type: String, default: '' },
    report: { type: String, default: '' }, // full incident write-up
    aiSource: { type: String, enum: AI_SOURCE_VALUES, default: AI_SOURCES.MOCK },
    relatedDeployment: { type: Schema.Types.ObjectId, ref: 'Deployment', default: null },
    resolvedAt: { type: Date, default: null },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { collection: 'incident_reports' }
);

incidentReportSchema.index({ severity: 1, status: 1, createdAt: -1 });

const IncidentReport = mongoose.model('IncidentReport', incidentReportSchema);
export default IncidentReport;
