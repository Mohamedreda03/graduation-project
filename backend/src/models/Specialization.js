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
      default: { "1": 2, "2": 2, "3": 2, "4": 2, "5": 2, "6": 2 }
    }
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Specialization", specializationSchema);
