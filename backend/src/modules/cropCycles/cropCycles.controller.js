import * as cropCyclesService from './cropCycles.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const listCropCycles = asyncHandler(async (req, res) => {
  const { cropCycles, meta } = await cropCyclesService.listCropCycles(
    req.user.id,
    req.validated.query || req.query
  );
  sendSuccess(res, { message: 'Crop cycles retrieved successfully', data: { cropCycles }, meta });
});

export const createCropCycle = asyncHandler(async (req, res) => {
  const cropCycle = await cropCyclesService.createCropCycle(req.user.id, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Crop cycle created successfully', data: { cropCycle } });
});

export const getCropCycle = asyncHandler(async (req, res) => {
  const cropCycle = await cropCyclesService.getCropCycleById(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Crop cycle details retrieved', data: { cropCycle } });
});

export const updateCropCycle = asyncHandler(async (req, res) => {
  const cropCycle = await cropCyclesService.updateCropCycle(req.user.id, req.params.id, req.body);
  sendSuccess(res, { message: 'Crop cycle updated successfully', data: { cropCycle } });
});

export const deleteCropCycle = asyncHandler(async (req, res) => {
  await cropCyclesService.deleteCropCycle(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Crop cycle deleted successfully', data: null });
});

