import { z } from 'zod';
import { uuidParam } from '../../middleware/validate.middleware.js';

export const farmIdParamSchema = {
  params: uuidParam('farmId'),
};

