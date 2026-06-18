/**
 * Repository layer barrel.
 *
 * Specialized repositories (User, Deployment, AuditLog) carry domain-specific
 * queries. The remaining collections use a ready-to-use BaseRepository instance,
 * which already provides CRUD, pagination, and soft delete.
 */
import BaseRepository from './BaseRepository.js';
import {
  CloudResource,
  SecurityReport,
  ComplianceReport,
  PortabilityReport,
  MigrationReport,
  IncidentReport,
  CostReport,
  AIRecommendation,
  Notification
} from '../models/index.js';

import userRepository from './UserRepository.js';
import deploymentRepository from './DeploymentRepository.js';
import auditLogRepository from './AuditLogRepository.js';

const cloudResourceRepository = new BaseRepository(CloudResource);
const securityReportRepository = new BaseRepository(SecurityReport);
const complianceReportRepository = new BaseRepository(ComplianceReport);
const portabilityReportRepository = new BaseRepository(PortabilityReport);
const migrationReportRepository = new BaseRepository(MigrationReport);
const incidentReportRepository = new BaseRepository(IncidentReport);
const costReportRepository = new BaseRepository(CostReport);
const aiRecommendationRepository = new BaseRepository(AIRecommendation);
const notificationRepository = new BaseRepository(Notification);

export {
  BaseRepository,
  userRepository,
  deploymentRepository,
  auditLogRepository,
  cloudResourceRepository,
  securityReportRepository,
  complianceReportRepository,
  portabilityReportRepository,
  migrationReportRepository,
  incidentReportRepository,
  costReportRepository,
  aiRecommendationRepository,
  notificationRepository
};
