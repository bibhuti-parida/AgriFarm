import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export const passwordFingerprint = (passwordHash) =>
  createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);

export const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      pwf: passwordFingerprint(user.passwordHash),
    },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );

const DUMMY_HASH = bcrypt.hashSync('dummy_timing_salt_string', env.BCRYPT_SALT_ROUNDS);

export const register = async ({ fullName, email, password, phone }) => {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', 'EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  try {
    const created = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        phone: phone ?? null,
      },
    });

    const { passwordHash: _omit, ...user } = created;
    return {
      user,
      token: signToken(created),
    };
  } catch (err) {
    if (err?.code === 'P2002') {
      throw ApiError.conflict('An account with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }
    throw err;
  }
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  const isMatch = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !isMatch) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('This account is not active', 'ACCOUNT_NOT_ACTIVE');
  }

  const { passwordHash: _omit, ...userData } = user;
  return {
    user: userData,
    token: signToken(user),
    expiresIn: env.JWT_EXPIRES_IN,
  };
};

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }
  return user;
};

export const updateProfile = async (userId, data) => {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });
  } catch (err) {
    if (err?.code === 'P2025') {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }
    throw err;
  }
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw ApiError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
  }

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return {
    token: signToken(updatedUser),
    expiresIn: env.JWT_EXPIRES_IN,
  };
};

export const signPasswordResetToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      pwf: passwordFingerprint(user.passwordHash),
      purpose: 'password_reset',
    },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '15m',
    }
  );

export const forgotPassword = async ({ email }) => {
  const genericMessage = 'If an account with this email exists, a password reset link has been generated.';
  const user = await prisma.user.findUnique({ where: { email } });

  // Prevent account enumeration: return identical message even if user not found or inactive
  if (!user || user.status !== 'active') {
    return {
      message: genericMessage,
    };
  }

  const resetToken = signPasswordResetToken(user);

  // In production, an email with the reset link would be dispatched.
  // We expose the resetToken in dev/test/staging environments so frontend and testing flows work immediately.
  const responseData = {
    message: genericMessage,
  };

  if (env.NODE_ENV !== 'production') {
    responseData.resetToken = resetToken;
    responseData.expiresIn = '15m';
  }

  return responseData;
};

export const resetPassword = async ({ token, newPassword }) => {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.badRequest('Password reset token has expired. Please request a new one.', 'TOKEN_EXPIRED');
    }
    throw ApiError.badRequest('Invalid or malformed password reset token.', 'INVALID_TOKEN');
  }

  if (payload.purpose !== 'password_reset' || !payload.sub || !payload.pwf) {
    throw ApiError.badRequest('Invalid password reset token.', 'INVALID_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== 'active') {
    throw ApiError.badRequest('Account associated with this token is invalid or inactive.', 'INVALID_TOKEN');
  }

  // Single-use token verification: compare password fingerprint
  if (payload.pwf !== passwordFingerprint(user.passwordHash)) {
    throw ApiError.badRequest(
      'This password reset token has already been used or has been superseded. Please request a new one.',
      'TOKEN_ALREADY_USED'
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return {
    message: 'Password has been successfully reset. Please log in with your new password.',
  };
};


