import * as farmsService from './farms.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const listFarms = asyncHandler(async (req, res) => {
  const { farms, meta } = await farmsService.listFarms(req.user.id, req.validated.query || req.query);
  sendSuccess(res, { message: 'Farms retrieved successfully', data: { farms }, meta });
});

export const createFarm = asyncHandler(async (req, res) => {
  const farm = await farmsService.createFarm(req.user.id, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Farm created successfully', data: { farm } });
});

export const getFarm = asyncHandler(async (req, res) => {
  const farm = await farmsService.getFarmById(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Farm details retrieved', data: { farm } });
});

export const updateFarm = asyncHandler(async (req, res) => {
  const farm = await farmsService.updateFarm(req.user.id, req.params.id, req.body);
  sendSuccess(res, { message: 'Farm updated successfully', data: { farm } });
});

export const deleteFarm = asyncHandler(async (req, res) => {
  await farmsService.deleteFarm(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Farm deleted successfully', data: null });
});

