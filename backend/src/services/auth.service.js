/**
 * Authentication service — business logic for register/login/profile/reset.
 * Talks to repositories and the token service; throws ApiError on failures.
 */
import userRepository from '../repositories/UserRepository.js';
import auditLogRepository from '../repositories/AuditLogRepository.js';
import tokenService from './token.service.js';
import { sendResetEmail } from './email.service.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';
import { ROLES, AUDIT_ACTIONS } from '../config/constants.js';

/**
 * Register a new user.
 * Security: self-registration cannot grant the Admin role. Only an existing
 * Admin can create Admins (handled by a separate admin user-management flow).
 */
async function register({ name, email, password, role, organization }, context = {}) {
  if (await userRepository.emailExists(email)) {
    throw ApiError.conflict('Email is already registered');
  }

  let assignedRole = role || ROLES.VIEWER;
  if (assignedRole === ROLES.ADMIN) {
    // Prevent privilege escalation via public registration.
    assignedRole = ROLES.VIEWER;
  }

  const user = await userRepository.create({
    name,
    email,
    password,
    role: assignedRole,
    organization
  });

  const tokens = await tokenService.generateAuthTokens(user);

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'User registered',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { user: user.toJSON(), tokens };
}

/** Authenticate with email + password. */
async function login({ email, password }, context = {}) {
  const user = await userRepository.findByEmail(email, { withPassword: true });

  // Uniform error to avoid user enumeration.
  const invalid = ApiError.unauthorized('Invalid email or password');
  if (!user) throw invalid;
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

  const match = await user.comparePassword(password);
  if (!match) {
    await auditLogRepository.record({
      actorEmail: email,
      action: AUDIT_ACTIONS.LOGIN,
      description: 'Failed login',
      success: false,
      ip: context.ip,
      userAgent: context.userAgent
    });
    throw invalid;
  }

  await userRepository.recordLogin(user.id);
  const tokens = await tokenService.generateAuthTokens(user);

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.LOGIN,
    description: 'User logged in',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { user: user.toJSON(), tokens };
}

/** Logout: revoke the supplied refresh token (if any). */
async function logout(refreshToken, context = {}) {
  await tokenService.revokeRefreshToken(refreshToken);
  await auditLogRepository.record({
    actor: context.userId,
    action: AUDIT_ACTIONS.LOGOUT,
    description: 'User logged out',
    ip: context.ip,
    userAgent: context.userAgent
  });
}

/** Exchange a valid refresh token for a new access+refresh pair (rotation). */
async function refreshTokens(refreshToken) {
  const { userId } = await tokenService.rotateRefreshToken(refreshToken);
  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) throw ApiError.unauthorized('User not found or inactive');
  const tokens = await tokenService.generateAuthTokens(user);
  return { tokens };
}

/** Get the current user's profile. */
async function getProfile(userId) {
  const user = await userRepository.findByIdOrFail(userId);
  return user.toJSON();
}

/** Update profile fields and optionally change password. */
async function updateProfile(userId, payload, context = {}) {
  const user = await userRepository.findByIdOrFail(userId);

  const { name, organization, avatarUrl, preferences, currentPassword, newPassword } = payload;
  if (name !== undefined) user.name = name;
  if (organization !== undefined) user.organization = organization;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (preferences) user.preferences = { ...user.preferences.toObject?.() ?? user.preferences, ...preferences };

  // Optional password change requires current password verification.
  if (newPassword) {
    if (!currentPassword) throw ApiError.badRequest('currentPassword is required to change password');
    const match = await userRepository.findByEmail(user.email, { withPassword: true })
      .then((u) => u.comparePassword(currentPassword));
    if (!match) throw ApiError.badRequest('Current password is incorrect');
    user.password = newPassword; // re-hashed by pre-save hook
    // Invalidate existing sessions after a password change.
    await tokenService.revokeAllUserTokens(user.id);
  }

  await user.save();

  await auditLogRepository.record({
    actor: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'User',
    entityId: String(user.id),
    description: 'Profile updated',
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user.toJSON();
}

/**
 * Begin password reset. Always resolves with a generic result to avoid leaking
 * which emails exist. In non-production, returns the raw token for demo/testing.
 */
async function forgotPassword(email) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    return { delivered: false }; // do not reveal non-existence
  }
  const rawToken = await tokenService.generateResetToken(user);

  // Send via SMTP when configured; fallback logs the token (demo mode).
  const sent = await sendResetEmail({ to: user.email, resetToken: rawToken });

  logger.info(`[auth] password reset for ${email}: sent=${sent}`);
  return { delivered: true, resetToken: env.isProd ? undefined : rawToken };
}

/** Complete password reset with a one-time token. */
async function resetPassword({ token, password }) {
  const userId = await tokenService.consumeResetToken(token);
  const user = await userRepository.findByIdOrFail(userId);
  user.password = password; // re-hashed by pre-save hook
  await user.save();
  await tokenService.revokeAllUserTokens(user.id); // invalidate sessions
  return { reset: true };
}

export default {
  register,
  login,
  logout,
  refreshTokens,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword
};
