import * as authService from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  sendSuccess(res, { statusCode: 201, message: 'Registration successful', data });
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  sendSuccess(res, { message: 'Login successful', data });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  sendSuccess(res, { message: 'Profile fetched successfully', data: { user } });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  sendSuccess(res, { message: 'Profile updated successfully', data: { user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = await authService.changePassword(req.user.id, req.body);
  sendSuccess(res, { message: 'Password changed successfully', data });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body);
  sendSuccess(res, { message: data.message, data });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  sendSuccess(res, { message: data.message, data });
});


