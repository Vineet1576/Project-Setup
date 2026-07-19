module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const notificationSchema = new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true,
      },
      type: {
        type: String,
        enum: [
          "subscription_reminder",
          "subscription_expired",
          "payment_success",
          "payment_failed",
          "new_message",
          "account_approved",
          "admin_broadcast",
          "system",
        ],
        required: true,
      },
      title: {
        type: String,
        required: true,
        trim: true,
      },
      message: {
        type: String,
        required: true,
        trim: true,
      },
      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
      read: {
        type: Boolean,
        default: false,
        index: true,
      },
      readAt: Date,
      dismissed: {
        type: Boolean,
        default: false,
        index: true,
      },
      dismissedAt: Date,
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

  notificationSchema.index({ userId: 1, createdAt: -1 });
  notificationSchema.index({ userId: 1, read: 1, dismissed: 1 });

  return (
    mongoose.models.notifications ||
    mongoose.model("notifications", notificationSchema)
  );
};
