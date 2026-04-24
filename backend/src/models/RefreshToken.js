const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceId: String,
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for cleanup
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user: 1 });

// Remove all tokens for a user
refreshTokenSchema.statics.removeAllForUser = function (userId) {
  return this.deleteMany({ user: userId });
};

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
