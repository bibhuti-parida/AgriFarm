import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { passwordFingerprint, publicUserSelect } from '../modules/auth/auth.service.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization ?? '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { ...publicUserSelect, passwordHash: true },
  });

  if (!user) {
    throw ApiError.unauthorized('Account no longer exists', 'INVALID_TOKEN');
  }

  if (payload.pwf !== passwordFingerprint(user.passwordHash)) {
    throw ApiError.unauthorized('Session has expired or password changed. Please log in again', 'INVALID_TOKEN');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('This account is not active', 'ACCOUNT_NOT_ACTIVE');
  }

  const { passwordHash: _omit, ...publicUser } = user;
  req.user = publicUser;
  next();
});

