import { Router } from 'express';
import * as controller from './weather.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { farmIdParamSchema } from './weather.validation.js';

// Nested router mounted under /api/v1/farms/:farmId/weather
const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', validate(farmIdParamSchema), controller.getWeather);
router.post('/refresh', validate(farmIdParamSchema), controller.refreshWeather);

export default router;

