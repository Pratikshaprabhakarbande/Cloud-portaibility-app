/**
 * Token model
 * Persists revocable refresh tokens and password-reset tokens.
 *
 * Security notes:
 *  - Only a SHA-256 hash of the token is stored, never the raw token.
 *  - Documents auto-expire at `expiresAt` via a TTL index.
 *  - `blacklisted` lets us revoke a refresh token on logout/rotation.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const TOKEN_TYPES = Object.freeze({
  REFRESH: 'refresh',
  RESET_PASSWORD: 'reset_password'
});

const tokenSchema = new Schema(
  {
    // SHA-256 hash of the raw token value
    tokenHash: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(TOKEN_TYPES), required: true },
    expiresAt: { type: Date, required: true },
    blacklisted: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false, collection: 'tokens' }
);

// TTL index: MongoDB removes the document once expiresAt passes.
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tokenSchema.index({ user: 1, type: 1 });

const Token = mongoose.model('Token', tokenSchema);
export default Token;
