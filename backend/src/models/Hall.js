const mongoose = require("mongoose");

const hallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hall name is required"],
      unique: true,
      trim: true,
    },
    building: {
      type: String,
      required: [true, "Building name is required"],
      trim: true,
    },
    capacity: {
      type: Number,
      min: 1,
    },

    // Access Point Info
    accessPoint: {
      ssid: {
        type: String,
        trim: true,
      },
      ipRange: {
        type: String,
        trim: true, // e.g., "192.168.137"
      },
      apIdentifier: {
        type: String,
        trim: true,
      },
      apiKey: {
        type: String,
        trim: true,
      },
      isOnline: {
        type: Boolean,
        default: false,
      },
      lastSeen: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Update lastSeen when AP sends data
hallSchema.methods.updateApStatus = function (isOnline = true) {
  this.accessPoint.isOnline = isOnline;
  this.accessPoint.lastSeen = new Date();
  return this.save();
};

// Find hall by AP identifier or IP range
hallSchema.statics.findByApInfo = function (apIdentifier, ipRange) {
  return this.findOne({
    $or: [
      { "accessPoint.apIdentifier": apIdentifier },
      { "accessPoint.ipRange": ipRange },
    ],
  });
};

// Hide sensitive apiKey from JSON responses
hallSchema.set("toJSON", {
  transform: function (doc, ret) {
    if (ret.accessPoint) {
      delete ret.accessPoint.apiKey;
    }
    return ret;
  },
});

module.exports = mongoose.model("Hall", hallSchema);
