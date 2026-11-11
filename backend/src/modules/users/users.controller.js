import * as usersService from './users.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const listUsers = asyncHandler(async (req, res) => {
  const users = await usersService.listUsers(req.query);
  sendSuccess(res, { message: 'Users retrieved successfully', data: { users } });
});

