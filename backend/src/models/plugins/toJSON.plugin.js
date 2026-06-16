/**
 * toJSON plugin
 * - Replaces `_id` with `id`
 * - Removes `__v` and any internal soft-delete bookkeeping from API output
 * - Allows per-schema `private: true` fields to be stripped automatically
 */
export default function toJSONPlugin(schema) {
  const transform = schema.options.toJSON?.transform;

  schema.options.toJSON = {
    virtuals: true,
    versionKey: false,
    transform(doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;

      // Strip fields explicitly marked `private` in the schema path options
      schema.eachPath((path, schemaType) => {
        if (schemaType.options && schemaType.options.private) {
          // support nested dot-paths
          const parts = path.split('.');
          let obj = ret;
          for (let i = 0; i < parts.length - 1; i += 1) obj = obj?.[parts[i]];
          if (obj) delete obj[parts[parts.length - 1]];
        }
      });

      if (typeof transform === 'function') {
        return transform(doc, ret, options);
      }
      return ret;
    }
  };
}
