export function sendResponse(res, payload, statusCode = 200) {
  return res.status(statusCode).json(payload);
}