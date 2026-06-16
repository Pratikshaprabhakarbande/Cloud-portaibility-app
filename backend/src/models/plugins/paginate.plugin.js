/**
 * paginate plugin
 * Adds a static `paginate(filter, options)` returning a normalized result:
 *   { results, page, limit, totalResults, totalPages, hasPrevPage, hasNextPage }
 *
 * options:
 *   - page   (default 1)
 *   - limit  (default 20, capped at 100)
 *   - sort   (string or object, default '-createdAt')
 *   - populate (string | array | object)
 *   - select (projection string)
 *   - withDeleted (boolean)
 */
import { PAGINATION } from '../../config/constants.js';

export default function paginatePlugin(schema) {
  schema.statics.paginate = async function paginate(filter = {}, options = {}) {
    const page = Math.max(parseInt(options.page, 10) || PAGINATION.DEFAULT_PAGE, 1);
    let limit = parseInt(options.limit, 10) || PAGINATION.DEFAULT_LIMIT;
    limit = Math.min(Math.max(limit, 1), PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;
    const sort = options.sort || '-createdAt';

    const queryOpts = options.withDeleted ? { withDeleted: true } : {};

    let query = this.find(filter, options.select || null, queryOpts).sort(sort).skip(skip).limit(limit);
    if (options.populate) query = query.populate(options.populate);

    const countQuery = this.countDocuments(filter);
    if (options.withDeleted) countQuery.setOptions({ withDeleted: true });

    const [results, totalResults] = await Promise.all([query.exec(), countQuery.exec()]);
    const totalPages = Math.ceil(totalResults / limit) || 0;

    return {
      results,
      page,
      limit,
      totalResults,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages
    };
  };
}
