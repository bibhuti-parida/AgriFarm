import * as tasksService from './tasks.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const listTasks = asyncHandler(async (req, res) => {
  const { tasks, meta } = await tasksService.listTasks(
    req.user.id,
    req.validated.query || req.query
  );
  sendSuccess(res, { message: 'Tasks retrieved successfully', data: { tasks }, meta });
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await tasksService.createTask(req.user.id, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Task created successfully', data: { task } });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await tasksService.getTaskById(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Task details retrieved', data: { task } });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await tasksService.updateTask(req.user.id, req.params.id, req.body);
  sendSuccess(res, { message: 'Task updated successfully', data: { task } });
});

export const completeTask = asyncHandler(async (req, res) => {
  const task = await tasksService.completeTask(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Task marked as completed', data: { task } });
});

export const deleteTask = asyncHandler(async (req, res) => {
  await tasksService.deleteTask(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Task deleted successfully', data: null });
});

