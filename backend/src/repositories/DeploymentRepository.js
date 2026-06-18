/**
 * DeploymentRepository
 * Deployment history queries, trends, and rollback lookups.
 */
import BaseRepository from './BaseRepository.js';
import { Deployment } from '../models/index.js';
import { DEPLOYMENT_STATUS } from '../config/constants.js';

class DeploymentRepository extends BaseRepository {
  constructor() {
    super(Deployment);
  }

  /** History with search + filters + pagination for Module 15. */
  async history({ search, provider, status, type, user, ...options } = {}) {
    const filter = {};
    if (provider) filter.provider = provider;
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (user) filter.user = user;
    if (search) {
      // Case-insensitive substring match on name. Escape regex metacharacters to
      // avoid injection/ReDoS. (Index-independent so it works deterministically
      // regardless of background text-index build state.)
      const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: safe, $options: 'i' };
    }
    return this.paginate(filter, { populate: 'user', ...options });
  }

  /** Latest successful deployment for a workload (rollback target). */
  async latestSuccessful(name, provider) {
    return this.model
      .findOne({ name, provider, status: DEPLOYMENT_STATUS.SUCCESS })
      .sort('-createdAt')
      .exec();
  }

  /** Deployment trend counts grouped by day for charts. */
  async trends({ days = 30, provider } = {}) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match = { createdAt: { $gte: since }, isDeleted: { $ne: true } };
    if (provider) match.provider = provider;
    return this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, status: '$status' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.day': 1 } }
    ]);
  }

  async countByStatus(provider) {
    const match = { isDeleted: { $ne: true } };
    if (provider) match.provider = provider;
    return this.model.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  }
}

export default new DeploymentRepository();
