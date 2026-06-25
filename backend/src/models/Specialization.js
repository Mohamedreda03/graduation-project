const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: [true, "Level number is required"],
  },
  name: {
    type: String,
    required: [true, "Level name is required"],
    trim: true
  },
  hasDepartments: {
    type: Boolean,
    default: false
  },
  sectionsCount: {
    type: Number,
    default: 2
  }
});

const specializationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Specialization name is required"],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Specialization code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    departments: [
      {
        type: String,
        trim: true
      }
    ],
    levels: [levelSchema],
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Specialization", specializationSchema);
