export const ok = (
  res,
  data = {},
  message = "Request successful",
  status = 200,
) => res.status(status).json({ success: true, message, data });
export const fail = (
  res,
  message = "Something went wrong",
  status = 400,
  errors = [],
) => res.status(status).json({ success: false, message, errors });
