const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Get setting value
settingSchema.statics.getValue = async function (key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Set setting value
settingSchema.statics.setValue = async function (
  key,
  value,
  description,
  userId,
) {
  return this.findOneAndUpdate(
    { key },
    { value, description, updatedBy: userId },
    { upsert: true, new: true },
  );
};

module.exports = mongoose.model("Setting", settingSchema);
