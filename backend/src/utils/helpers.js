/**
 * Wrap async route handlers to catch errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Get current time in Egypt timezone (Africa/Cairo)
 */
const getLocalTime = (date = new Date()) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
};

/**
 * Get today's date at midnight (Local Egypt Time, stored as UTC)
 */
const getTodayDate = () => {
  const today = getLocalTime();
  // We want to return a Date object representing 00:00:00 of the local day in UTC
  // so that MongoDB queries for "today" match perfectly regardless of server timezone.
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
};

/**
 * Parse time string to minutes since midnight
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Get current time as HH:MM string in Local Egypt Time
 */
const getCurrentTimeString = () => {
  const now = getLocalTime();
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
 * Normalize MAC address format to XX:XX:XX:XX:XX:XX (uppercase, colon-separated)
 * Handles: AA:BB:CC:DD:EE:FF, AA-BB-CC-DD-EE-FF, AA.BB.CC.DD.EE.FF, AABBCCDDEEFF
 */
const normalizeMacAddress = (mac) => {
  if (!mac) return null;
  // Trim whitespace and uppercase
  const cleaned = mac.trim().toUpperCase();
  // Remove all common separators (colon, dash, dot)
  const stripped = cleaned.replace(/[:\-\.]/g, "");
  // If exactly 12 hex chars, reformat as XX:XX:XX:XX:XX:XX
  if (/^[0-9A-F]{12}$/.test(stripped)) {
    return stripped.match(/.{2}/g).join(":");
  }
  // Fallback: return cleaned as-is (already colon-separated or unknown format)
  return cleaned;
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

/**
 * Build MongoDB search query for name (supporting first + last name search) and other optional fields.
 */
const buildNameSearchQuery = (search, otherFields = []) => {
  if (!search) return {};
  const cleanSearch = search.trim();
  const parts = cleanSearch.split(/\s+/);

  const orQueries = [
    { "name.first": { $regex: cleanSearch, $options: "i" } },
    { "name.last": { $regex: cleanSearch, $options: "i" } },
  ];

  if (parts.length > 1) {
    const firstNameSearch = parts[0];
    const lastNameSearch = parts.slice(1).join(" ");
    orQueries.push({
      $and: [
        { "name.first": { $regex: firstNameSearch, $options: "i" } },
        { "name.last": { $regex: lastNameSearch, $options: "i" } },
      ],
    });
  }

  for (const field of otherFields) {
    orQueries.push({ [field]: { $regex: cleanSearch, $options: "i" } });
  }

  return { $or: orQueries };
};

module.exports = {
  catchAsync,
  getLocalTime,
  getTodayDate,
  timeToMinutes,
  getCurrentTimeString,
  calculateDuration,
  calculateMinutes,
  normalizeMacAddress,
  paginate,
  paginationResponse,
  buildNameSearchQuery,
};
