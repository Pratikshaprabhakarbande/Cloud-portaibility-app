/**
 * Deployment routes — /api/deployments (all require authentication).
 *   GET /:id   single deployment detail (logs, config, status, timeline)
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import deploymentRepository from '../repositories/DeploymentRepository.js';
import { AuditLog } from '../models/index.js';

const router = Router();
router.use(authenticate);

router.get('/:id', asyncHandler(async (req, res) => {
  const dep = await deploymentRepository.findByIdOrFail(req.params.id, { populate: 'user previousDeployment' });
  // Build a status timeline from audit log entries for this deployment.
  const timeline = await AuditLog.find({
    entityType: 'Deployment',
    entityId: String(dep.id)
  }).sort('createdAt').limit(20).lean();

  return sendSuccess(res, {
    message: 'Deployment detail',
    data: {
      id: String(dep.id),
      name: dep.name,
      provider: dep.provider,
      region: dep.region,
      type: dep.type,
      status: dep.status,
      version: dep.version,
      config: dep.config,
      artifact: dep.artifact,
      logsRef: dep.logsRef,
      errorMessage: dep.errorMessage,
      durationMs: dep.durationMs,
      startedAt: dep.startedAt,
      finishedAt: dep.finishedAt,
      isRollbackable: dep.isRollbackable,
      user: dep.user ? { id: String(dep.user.id || dep.user._id), name: dep.user.name, email: dep.user.email } : null,
      previousDeployment: dep.previousDeployment ? String(dep.previousDeployment.id || dep.previousDeployment._id) : null,
      createdAt: dep.createdAt,
      updatedAt: dep.updatedAt,
      timeline: timeline.map((e) => ({
        action: e.action,
        description: e.description,
        actor: e.actorEmail,
        at: e.createdAt
      }))
    }
  });
}));

export default router;
