import * as fieldsService from './fields.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const listFieldsByFarm = asyncHandler(async (req, res) => {
  const fields = await fieldsService.listFieldsByFarm(req.user.id, req.params.farmId, req.query);
  sendSuccess(res, { message: 'Fields retrieved successfully', data: { fields } });
});

export const createField = asyncHandler(async (req, res) => {
  const field = await fieldsService.createField(req.user.id, req.params.farmId, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Field created successfully', data: { field } });
});

export const getField = asyncHandler(async (req, res) => {
  const field = await fieldsService.getFieldById(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Field details retrieved', data: { field } });
});

export const updateField = asyncHandler(async (req, res) => {
  const field = await fieldsService.updateField(req.user.id, req.params.id, req.body);
  sendSuccess(res, { message: 'Field updated successfully', data: { field } });
});

export const deleteField = asyncHandler(async (req, res) => {
  await fieldsService.deleteField(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Field deleted successfully', data: null });
});

