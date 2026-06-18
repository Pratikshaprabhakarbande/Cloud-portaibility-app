import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import finopsService from '../services/finops.service.js';

export const summary = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Cost summary', data: await finopsService.getSummary(req.query.provider) })
);

export const recommendations = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Cost recommendations', data: await finopsService.getRecommendations(req.query.provider) })
);

export const analyze = asyncHandler(async (req, res) =>
  sendCreated(res, { message: 'FinOps analysis complete', data: await finopsService.analyze({ provider: req.body.provider, user: req.user }) })
);

export const reports = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'FinOps reports', data: await finopsService.getReports(req.query) })
);

export default { summary, recommendations, analyze, reports };
