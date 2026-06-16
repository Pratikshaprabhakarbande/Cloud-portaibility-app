/**
 * BaseRepository
 * Generic data-access layer over a Mongoose model. Encapsulates CRUD,
 * pagination, and soft delete so services never talk to Mongoose directly.
 *
 * This keeps business logic (services) decoupled from persistence details and
 * makes the data layer easy to mock in tests.
 */
import ApiError from '../utils/ApiError.js';

export default class BaseRepository {
  /** @param {import('mongoose').Model} model */
  constructor(model) {
    this.model = model;
  }

  /** Create a document. `actor` is recorded in audit fields when available. */
  async create(data, actor = null) {
    const payload = { ...data };
    if (actor && this.model.schema.path('createdBy')) {
      payload.createdBy = payload.createdBy ?? actor.id ?? actor._id;
      payload.updatedBy = payload.updatedBy ?? actor.id ?? actor._id;
      if (this.model.schema.path('ownerRole')) {
        payload.ownerRole = payload.ownerRole ?? actor.role ?? null;
      }
    }
    return this.model.create(payload);
  }

  async findById(id, { populate, withDeleted = false } = {}) {
    let q = this.model.findById(id, null, withDeleted ? { withDeleted: true } : {});
    if (populate) q = q.populate(populate);
    return q.exec();
  }

  /** Like findById but throws 404 when missing. */
  async findByIdOrFail(id, opts) {
    const doc = await this.findById(id, opts);
    if (!doc) throw ApiError.notFound(`${this.model.modelName} not found`);
    return doc;
  }

  async findOne(filter = {}, opts = {}) {
    return this.model.findOne(filter, opts.select || null).exec();
  }

  async find(filter = {}, { sort = '-createdAt', limit = 0, populate, select } = {}) {
    let q = this.model.find(filter, select || null).sort(sort);
    if (limit) q = q.limit(limit);
    if (populate) q = q.populate(populate);
    return q.exec();
  }

  /** Paginated list. options: { page, limit, sort, populate, select, withDeleted } */
  async paginate(filter = {}, options = {}) {
    return this.model.paginate(filter, options);
  }

  async updateById(id, update, actor = null) {
    if (actor && this.model.schema.path('updatedBy')) {
      update.updatedBy = actor.id ?? actor._id;
    }
    const doc = await this.model.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true
    });
    if (!doc) throw ApiError.notFound(`${this.model.modelName} not found`);
    return doc;
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async exists(filter = {}) {
    return (await this.model.exists(filter)) !== null;
  }

  /** Soft delete when the model supports it, otherwise hard delete. */
  async deleteById(id, actor = null) {
    const doc = await this.model.findById(id);
    if (!doc) throw ApiError.notFound(`${this.model.modelName} not found`);
    if (typeof doc.softDelete === 'function') {
      return doc.softDelete(actor?.id ?? actor?._id ?? null);
    }
    await doc.deleteOne();
    return doc;
  }

  /** Permanently remove a document (use with care). */
  async hardDeleteById(id) {
    return this.model.findByIdAndDelete(id, { withDeleted: true });
  }

  async restoreById(id) {
    const doc = await this.model.findById(id, null, { withDeleted: true });
    if (!doc) throw ApiError.notFound(`${this.model.modelName} not found`);
    if (typeof doc.restore !== 'function') {
      throw ApiError.badRequest(`${this.model.modelName} does not support restore`);
    }
    return doc.restore();
  }
}
