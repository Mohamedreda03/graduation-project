const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES, DEVICE_REQUEST_STATUS } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    studentId: {
      type: String,
      unique: true,
      sparse: true, // Only for students
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    name: {
      first: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
      },
      last: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
      },
    },
    phone: {
      type: String,
      trim: true,
    },

    // Role
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
    },

    // Academic Info (for students)
    academicInfo: {
      department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
      level: {
        type: Number,
        min: 1,
        max: 6,
      },
      specialization: {
        type: String,
        trim: true,
      },
      enrolledCourses: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
      ],
    },

    // Device Binding (ONE device only!)
    device: {
      deviceId: String,
      macAddress: String,
      registeredAt: Date,
      isVerified: {
        type: Boolean,
        default: false,
      },
    },

    // Device Change Request
    deviceChangeRequest: {
      requested: {
        type: Boolean,
        default: false,
      },
      requestedAt: Date,
      reason: String,
      newDeviceInfo: {
        deviceId: String,
        macAddress: String,
        deviceName: String,
      },
      status: {
        type: String,
        enum: Object.values(DEVICE_REQUEST_STATUS),
      },
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,

    // FCM Token for Push Notifications
    fcmToken: String,
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
userSchema.index({ "device.macAddress": 1 });
userSchema.index({ "device.deviceId": 1 });
userSchema.index({ role: 1 });
userSchema.index({ "academicInfo.department": 1, "academicInfo.level": 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.name.first} ${this.name.last}`;
});

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if device matches (MAC address is the primary identifier)
userSchema.methods.isDeviceMatch = function (deviceInfo) {
  if (!this.device || !this.device.isVerified) return false;

  const { deviceId, macAddress } = deviceInfo;

  // MAC address is the primary identifier
  if (macAddress && this.device.macAddress === macAddress) {
    return true;
  }

  // DeviceId as fallback
  if (deviceId && this.device.deviceId === deviceId) {
    return true;
  }

  return false;
};

// Find student by MAC Address
userSchema.statics.findByMacAddress = function (macAddress) {
  return this.findOne({
    "device.macAddress": macAddress,
    "device.isVerified": true,
    role: ROLES.STUDENT,
  });
};

/**
 * Find student by device identifier (MAC address → deviceId fallback)
 * Used by Access Point events
 */
userSchema.statics.findByDeviceIdentifier = async function (identifier) {
  if (!identifier) return null;

  console.log("[findByDeviceIdentifier] Looking for:", identifier);

  // 1. Try MAC address with isVerified: true
  let student = await this.findOne({
    role: ROLES.STUDENT,
    "device.macAddress": identifier,
    "device.isVerified": true,
  });
  if (student) {
    console.log(
      "[findByDeviceIdentifier] Found by MAC (verified):",
      student.studentId,
    );
    return student;
  }

  // 2. Try MAC address without isVerified check (admin-set MAC addresses)
  student = await this.findOne({
    role: ROLES.STUDENT,
    "device.macAddress": identifier,
  });
  if (student) {
    console.log(
      "[findByDeviceIdentifier] Found by MAC (unverified):",
      student.studentId,
      "| isVerified:",
      student.device?.isVerified,
    );
    return student;
  }

  // 3. Try deviceId as fallback
  student = await this.findOne({
    role: ROLES.STUDENT,
    "device.deviceId": identifier,
    "device.isVerified": true,
  });
  if (student) {
    console.log(
      "[findByDeviceIdentifier] Found by deviceId:",
      student.studentId,
    );
  } else {
    console.log(
      "[findByDeviceIdentifier] NOT FOUND for identifier:",
      identifier,
    );
  }

  return student;
};

// Ensure virtuals are included in JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
