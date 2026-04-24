const { Setting } = require("../models");
const ApiError = require("../utils/ApiError");
const { catchAsync } = require("../utils/helpers");

/**
 * Get all settings
 * GET /api/settings
 */
exports.getAllSettings = catchAsync(async (req, res, next) => {
  const settings = await Setting.find({});

  // Convert to key-value object
  const settingsObj = {};
  settings.forEach((s) => {
    settingsObj[s.key] = {
      value: s.value,
      description: s.description,
      updatedAt: s.updatedAt,
    };
  });

  res.status(200).json({
    success: true,
    data: settingsObj,
  });
});

/**
 * Get a specific setting by key
 * GET /api/settings/:key
 */
exports.getSetting = catchAsync(async (req, res, next) => {
  const { key } = req.params;

  const setting = await Setting.findOne({ key });

  if (!setting) {
    return next(new ApiError(`Setting '${key}' not found`, 404));
  }

  res.status(200).json({
    success: true,
    data: setting,
  });
});

/**
 * Update or create a setting
 * PUT /api/settings/:key
 */
exports.updateSetting = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  const { value, description } = req.body;

  if (value === undefined) {
    return next(new ApiError("Value is required", 400));
  }

  let setting = await Setting.findOne({ key });

  if (setting) {
    setting.value = value;
    if (description) setting.description = description;
    setting.updatedBy = req.user._id;
    await setting.save();
  } else {
    setting = await Setting.create({
      key,
      value,
      description,
      updatedBy: req.user._id,
    });
  }

  res.status(200).json({
    success: true,
    message: "Setting updated successfully",
    data: setting,
  });
});

/**
 * Delete a setting
 * DELETE /api/settings/:key
 */
exports.deleteSetting = catchAsync(async (req, res, next) => {
  const { key } = req.params;

  const setting = await Setting.findOneAndDelete({ key });

  if (!setting) {
    return next(new ApiError(`Setting '${key}' not found`, 404));
  }

  res.status(200).json({
    success: true,
    message: "Setting deleted successfully",
  });
});

/**
 * Initialize default settings
 * POST /api/settings/initialize
 */
exports.initializeSettings = catchAsync(async (req, res, next) => {
  const defaultSettings = [
    {
      key: "MIN_PRESENCE_PERCENTAGE",
      value: 85,
      description:
        "Minimum presence percentage required for attendance to be marked as present",
    },
    {
      key: "LATE_THRESHOLD_MINUTES",
      value: 15,
      description: "Minutes after lecture start to mark attendance as late",
    },
    {
      key: "EARLY_LEAVE_THRESHOLD_MINUTES",
      value: 10,
      description: "Minutes before lecture end to consider as early leave",
    },
    {
      key: "DEVICE_CHANGE_COOLDOWN_DAYS",
      value: 30,
      description: "Minimum days between device change requests",
    },
    {
      key: "MAX_DEVICE_CHANGES_PER_SEMESTER",
      value: 2,
      description: "Maximum number of device changes allowed per semester",
    },
    {
      key: "AUTO_FINALIZE_AFTER_MINUTES",
      value: 30,
      description:
        "Minutes after lecture end to auto-finalize attendance records",
    },
    {
      key: "SYSTEM_TIMEZONE",
      value: "Africa/Cairo",
      description: "System timezone for date/time calculations",
    },
  ];

  const results = {
    created: [],
    skipped: [],
  };

  for (const setting of defaultSettings) {
    const exists = await Setting.findOne({ key: setting.key });
    if (!exists) {
      await Setting.create({
        ...setting,
        updatedBy: req.user._id,
      });
      results.created.push(setting.key);
    } else {
      results.skipped.push(setting.key);
    }
  }

  res.status(200).json({
    success: true,
    message: "Settings initialized",
    data: results,
  });
});

/**
 * Get setting value (helper for internal use)
 */
exports.getSettingValue = async (key, defaultValue = null) => {
  const setting = await Setting.findOne({ key });
  return setting ? setting.value : defaultValue;
};
