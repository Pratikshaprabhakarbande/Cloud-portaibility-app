import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import migrationService from '../services/migration.service.js';

export const compare = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Migration comparison', data: migrationService.compare(req.query.source, req.query.target) })
);

export const plan = asyncHandler(async (req, res) =>
  sendCreated(res, {
    message: 'Migration plan generated',
    data: await migrationService.plan({
      sourceProvider: req.body.sourceProvider,
      targetProvider: req.body.targetProvider,
      workloadName: req.body.workloadName,
      user: req.user
    })
  })
);

export const reports = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Migration reports', data: await migrationService.getReports(req.query) })
);

export default { compare, plan, reports };
