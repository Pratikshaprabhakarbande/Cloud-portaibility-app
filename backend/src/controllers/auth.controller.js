/**
 * Auth controller — thin HTTP layer over auth.service.
 * Parses requests, calls the service, and formats the response envelope.
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import authService from '../services/auth.service.js';

const reqContext = (req) => ({
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  userId: req.user?.id
});

export const register = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.register(req.body, reqContext(req));
  return sendCreated(res, { message: 'Registration successful', data: { user, tokens } });
});

export const login = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.login(req.body, reqContext(req));
  return sendSuccess(res, { message: 'Login successful', data: { user, tokens } });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body?.refreshToken, reqContext(req));
  return sendSuccess(res, { message: 'Logout successful' });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { tokens } = await authService.refreshTokens(req.body.refreshToken);
  return sendSuccess(res, { message: 'Token refreshed', data: { tokens } });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return sendSuccess(res, { message: 'Profile fetched', data: { user } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body, reqContext(req));
  return sendSuccess(res, { message: 'Profile updated', data: { user } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, {
    message: 'If an account exists for that email, a reset link has been sent.',
    data: result
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return sendSuccess(res, { message: 'Password has been reset. Please log in again.' });
});

export default {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword
};
