module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const userSchema = new Schema(
    {
      firstName: {
        type: String,
        trim: true,
      },

      lastName: {
        type: String,
        trim: true,
      },

      fullName: {
        type: String,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },

      password: {
        type: String,
        required: true,
        select: false,
      },

      dialCode: {
        type: String,
        trim: true,
      },

      mobileno: {
        type: String,
        trim: true,
      },

      image: {
        type: String,
        default: "",
      },

      address: String,
      city: String,
      state: String,
      country: String,
      pinCode: String,

      dob: Date,

      gender: {
        type: String,
        enum: ["male", "female", "other"],
      },

      isVerified: {
        type: String,
        enum: ["Y", "N"],
        default: "N",
      },

      verificationCode: String,

      verificationCodeExpiresAt: Date,

      role: {
        type: Schema.Types.ObjectId,
        ref: "roles",
        index: true,
      },

      status: {
        type: String,
        enum: ["active", "inactive", "blocked"],
        default: "active",
        index: true,
      },

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },

      approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected", "completed"],
        default: "completed",
      },

      isExpire: {
        type: Boolean,
        default: false,
      },

      lastLoginDate: Date,

      firstJoinDate: {
        type: Date,
        default: Date.now,
      },

      addedBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },

      deactivatedAt: Date,

      currentLocation: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [0, 0], // [longitude, latitude]
          validate: {
            validator(value) {
              return value.length === 2;
            },
            message: "Coordinates must contain longitude and latitude.",
          },
        },
      },

      planId: {
        type: Schema.Types.ObjectId,
        ref: "plans",
      },

      subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: "subscriptions",
      },

      freePlanBuy: {
        type: Boolean,
        default: false,
      },

      validUpto: Date,

      customer_id: {
        type: String,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

  // Compound Indexes
  userSchema.index({ email: 1, isDeleted: 1 });
  userSchema.index({ status: 1, isDeleted: 1 });
  userSchema.index({ currentLocation: "2dsphere" });

  // Hide sensitive fields
  userSchema.methods.toJSON = function () {
    const obj = this.toObject();

    obj.id = obj._id;
    delete obj._id;
    delete obj.password;

    return obj;
  };

  return mongoose.models.users || mongoose.model("users", userSchema);
};
