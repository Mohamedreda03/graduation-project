/**
 * Wrap async route handlers to catch errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Get today's date at midnight
 */
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Parse time string to minutes since midnight
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Get current time as HH:MM string
 */
const getCurrentTimeString = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Calculate duration between two times in minutes
 */
const calculateDuration = (startTime, endTime) => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

/**
 * Calculate minutes between two Date objects
 */
const calculateMinutes = (start, end) => {
  return Math.round((new Date(end) - new Date(start)) / (1000 * 60));
};

/**
 * Normalize MAC address format
 */
const normalizeMacAddress = (mac) => {
  if (!mac) return null;
  return mac.toUpperCase().replace(/-/g, ":");
};

/**
 * Paginate query results
 */
const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

/**
 * Build pagination response
 */
const paginationResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

module.exports = {
  catchAsync,
  getTodayDate,
  timeToMinutes,
  getCurrentTimeString,
  calculateDuration,
  calculateMinutes,
  normalizeMacAddress,
  paginate,
  paginationResponse,
};
