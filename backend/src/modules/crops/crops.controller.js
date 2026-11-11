import * as cropsService from './crops.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const listCrops = asyncHandler(async (req, res) => {
  const { crops, meta } = await cropsService.listCrops(req.query);
  sendSuccess(res, { message: 'Crop catalog retrieved successfully', data: { crops }, meta });
});

export const getCrop = asyncHandler(async (req, res) => {
  const crop = await cropsService.getCropById(req.params.id);
  sendSuccess(res, { message: 'Crop details retrieved', data: { crop } });
});

