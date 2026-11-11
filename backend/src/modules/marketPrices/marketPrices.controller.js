import * as marketPricesService from './marketPrices.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const listMarketPrices = asyncHandler(async (req, res) => {
  const { prices, providerStatus, meta } = await marketPricesService.listMarketPrices(
    req.validated.query || req.query
  );
  sendSuccess(res, {
    message: 'Market prices retrieved successfully',
    data: { prices, providerStatus },
    meta,
  });
});

export const getLatestMarketPrices = asyncHandler(async (req, res) => {
  const data = await marketPricesService.getLatestMarketPrices(req.validated.query || req.query);
  sendSuccess(res, { message: 'Latest market prices retrieved successfully', data });
});

