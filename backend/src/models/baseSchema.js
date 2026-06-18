/**
 * Base schema helper.
 *
 * Provides:
 *  - audit fields (createdBy, updatedBy) and role-based ownership (ownerRole)
 *  - consistent schema options (timestamps, minimize off)
 *  - registration of the shared plugins (toJSON, softDelete, paginate)
 *
 * Usage:
 *   const schema = createSchema({ ...fields }, { collection: 'deployments' });
 */
import mongoose from 'mongoose';
import { ROLE_VALUES } from '../config/constants.js';
import { toJSONPlugin, softDeletePlugin, paginatePlugin } from './plugins/index.js';

const { Schema } = mongoose;

/** Audit + ownership fields attached to every domain document. */
export const auditFields = {
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  // Role that owns/created the record — supports role-based filtering.
  ownerRole: { type: String, enum: ROLE_VALUES, default: null, index: true }
};

/**
 * Create a schema with shared options, audit fields, and plugins applied.
 * @param {object} definition Field definitions
 * @param {object} [options] Mongoose schema options (e.g. { collection })
 * @param {object} [config]
 * @param {boolean} [config.audit=true] include audit/ownership fields
 * @param {boolean} [config.softDelete=true] enable soft delete
 */
export function createSchema(definition, options = {}, config = {}) {
  const { audit = true, softDelete = true } = config;

  const schema = new Schema(
    { ...definition, ...(audit ? auditFields : {}) },
    {
      timestamps: true, // adds createdAt + updatedAt
      minimize: false,
      versionKey: false,
      ...options
    }
  );

  schema.plugin(toJSONPlugin);
  schema.plugin(paginatePlugin);
  if (softDelete) schema.plugin(softDeletePlugin);

  return schema;
}

export default createSchema;
