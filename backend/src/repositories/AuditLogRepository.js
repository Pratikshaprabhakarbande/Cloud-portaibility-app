/**
 * AuditLogRepository
 * Append-only writes plus convenience `record()` helper.
 */
import BaseRepository from './BaseRepository.js';
import { AuditLog } from '../models/index.js';

class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  /**
   * Record an audit entry. Never throws into the caller's flow — auditing must
   * not break the primary request.
   * @param {object} entry
   */
  async record(entry) {
    try {
      return await this.model.create({
        actor: entry.actor ?? null,
        actorEmail: entry.actorEmail ?? null,
        actorRole: entry.actorRole ?? null,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        description: entry.description ?? '',
        metadata: entry.metadata ?? {},
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        success: entry.success ?? true
      });
    } catch {
      return null;
    }
  }
}

export default new AuditLogRepository();
