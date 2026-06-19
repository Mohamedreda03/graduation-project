const mongoose = require("mongoose");

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
    faculty: {
      type: String,
      required: [true, "Faculty name is required"],
      trim: true,
    },
    sectionsCount: {
      type: Map,
      of: Number,
      default: { "1": 6, "2": 3, "3": 3, "4": 3, "5": 3 }
    }
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Specialization", specializationSchema);
