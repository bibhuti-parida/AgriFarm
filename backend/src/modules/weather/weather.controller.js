import * as weatherService from './weather.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const getWeather = asyncHandler(async (req, res) => {
  const data = await weatherService.getFarmWeather(req.user.id, req.params.farmId, { forceRefresh: false });
  sendSuccess(res, { message: 'Weather data retrieved successfully', data });
});

export const refreshWeather = asyncHandler(async (req, res) => {
  const data = await weatherService.getFarmWeather(req.user.id, req.params.farmId, { forceRefresh: true });
  sendSuccess(res, { message: 'Weather refreshed successfully', data });
});

