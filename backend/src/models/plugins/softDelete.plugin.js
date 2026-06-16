/**
 * softDelete plugin
 * Adds non-destructive deletion:
 *   - fields: isDeleted, deletedAt, deletedBy
 *   - instance methods: softDelete(userId), restore()
 *   - statics: findDeleted(), countDocumentsWithDeleted()
 *   - query middleware: excludes soft-deleted docs by default
 *
 * To include deleted docs in a query, pass `{ withDeleted: true }` as a query
 * option, e.g. `Model.find(filter, null, { withDeleted: true })`.
 */
export default function softDeletePlugin(schema) {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: 'ObjectId', ref: 'User', default: null }
  });

  const READ_OPS = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'count',
    'countDocuments',
    'updateMany',
    'updateOne'
  ];

  READ_OPS.forEach((op) => {
    schema.pre(op, function applyNotDeletedFilter() {
      const opts = this.getOptions ? this.getOptions() : {};
      if (!opts.withDeleted) {
        const filter = this.getFilter();
        if (filter.isDeleted === undefined) {
          this.where({ isDeleted: { $ne: true } });
        }
      }
    });
  });

  schema.methods.softDelete = async function softDelete(userId = null) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
  };

  schema.methods.restore = async function restore() {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
  };

  schema.statics.findDeleted = function findDeleted(filter = {}) {
    return this.find({ ...filter, isDeleted: true }, null, { withDeleted: true });
  };
}
