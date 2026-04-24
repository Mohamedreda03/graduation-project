const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: [true, "Hall is required"],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor is required"],
    },

    // Lecture metadata
    lectureType: {
      type: String,
      enum: ["lecture", "section", "lab"],
      default: "lecture",
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    weekPattern: {
      type: String,
      enum: ["weekly", "odd", "even"],
      default: "weekly",
    },

    // Schedule
    dayOfWeek: {
      type: Number,
      required: [true, "Day of week is required"],
      min: 0,
      max: 6, // 0 = Sunday, 6 = Saturday
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
    },

    // For quick filtering
    level: {
      type: Number,
      min: 1,
      max: 6,
    },
    specialization: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for finding active lectures
lectureSchema.index({ hall: 1, dayOfWeek: 1, isActive: 1 });
lectureSchema.index({ course: 1 });
lectureSchema.index({ doctor: 1 });

// Calculate lecture duration in minutes
lectureSchema.virtual("durationMinutes").get(function () {
  if (!this.startTime || !this.endTime) return 0;
  const [startHour, startMin] = this.startTime.split(":").map(Number);
  const [endHour, endMin] = this.endTime.split(":").map(Number);
  return endHour * 60 + endMin - (startHour * 60 + startMin);
});

// Check if lecture is currently active
lectureSchema.methods.isCurrentlyActive = function (currentTime = new Date()) {
  if (!this.startTime || !this.endTime) return false;
  const currentDay = currentTime.getDay();
  if (currentDay !== this.dayOfWeek) return false;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const [startHour, startMin] = this.startTime.split(":").map(Number);
  const [endHour, endMin] = this.endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

// Find currently active lecture in a hall
lectureSchema.statics.findActiveLecture = async function (
  hallId,
  currentTime = new Date(),
) {
  const currentDay = currentTime.getDay();
  const currentHours = currentTime.getHours().toString().padStart(2, "0");
  const currentMins = currentTime.getMinutes().toString().padStart(2, "0");
  const currentTimeStr = `${currentHours}:${currentMins}`;

  // Match lectures that are either:
  // 1. Scheduled for right now (by time window), or
  // 2. Manually set to "in-progress" status
  return this.findOne({
    hall: hallId,
    isActive: true,
    $or: [
      {
        // Match by scheduled time window
        dayOfWeek: currentDay,
        startTime: { $lte: currentTimeStr },
        endTime: { $gte: currentTimeStr },
      },
      {
        // Match if manually activated
        status: "in-progress",
      },
    ],
  }).populate("course doctor");
};

lectureSchema.set("toJSON", { virtuals: true });
lectureSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Lecture", lectureSchema);
