const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Department code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    faculty: {
      type: String,
      required: [true, "Faculty name is required"],
      trim: true,
    },
    specializations: [
      {
        name: {
          type: String,
          required: [true, "Specialization name is required"],
          trim: true,
        },
        code: {
          type: String,
          trim: true,
          uppercase: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Department", departmentSchema);
