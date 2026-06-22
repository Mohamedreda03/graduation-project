const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    specialization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialization",
      required: [true, "Specialization is required"],
    },
    departments: [
      {
        type: String,
        trim: true,
      },
    ],
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor is required"],
    },
    level: {
      type: Number,
      required: [true, "Level is required"],
      min: 1,
      max: 5,
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      trim: true, // e.g., "Fall 2025", "Spring 2026"
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
courseSchema.index({ specialization: 1, level: 1 });
courseSchema.index({ doctor: 1 });
courseSchema.index({ semester: 1 });

module.exports = mongoose.model("Course", courseSchema);
