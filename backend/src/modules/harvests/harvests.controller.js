import * as harvestsService from './harvests.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const listHarvestsByCycle = asyncHandler(async (req, res) => {
  const harvests = await harvestsService.listHarvestsByCycle(req.user.id, req.params.cropCycleId);
  sendSuccess(res, { message: 'Harvests retrieved successfully', data: { harvests } });
});

export const listAllHarvests = asyncHandler(async (req, res) => {
  const { harvests, summary, meta } = await harvestsService.listAllHarvests(
    req.user.id,
    req.validated.query || req.query
  );
  sendSuccess(res, { message: 'Harvest records retrieved successfully', data: { harvests, summary }, meta });
});

export const createHarvest = asyncHandler(async (req, res) => {
  const harvest = await harvestsService.createHarvest(req.user.id, req.params.cropCycleId, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Harvest recorded successfully', data: { harvest } });
});

export const getHarvest = asyncHandler(async (req, res) => {
  const harvest = await harvestsService.getHarvestById(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Harvest details retrieved', data: { harvest } });
});

export const updateHarvest = asyncHandler(async (req, res) => {
  const harvest = await harvestsService.updateHarvest(req.user.id, req.params.id, req.body);
  sendSuccess(res, { message: 'Harvest updated successfully', data: { harvest } });
});

export const deleteHarvest = asyncHandler(async (req, res) => {
  await harvestsService.deleteHarvest(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Harvest deleted successfully', data: null });
});

