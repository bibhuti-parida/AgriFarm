export const sendSuccess = (
  res,
  { statusCode = 200, message = 'Operation successful', data = null, meta = null } = {}
) => {
  const body = {
    success: true,
    message,
    data,
  };
  if (meta) {
    body.meta = meta;
  }
  return res.status(statusCode).json(body);
};

export const buildPaginationMeta = ({ page, limit, total }) => ({
  page: Number(page),
  limit: Number(limit),
  total: Number(total),
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

