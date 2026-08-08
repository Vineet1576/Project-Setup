module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const subscriptionSchema = new Schema(
    {
      plan_id: {
        type: Schema.Types.ObjectId,
        ref: "plans",
      },
      stripe_price_id: {
        type: String,
      },
      unit_amount: {
        type: Number,
      },
      currency: {
        type: String,
      },
      interval: {
        type: Object,
        default: {},
      },
      dispensary: {
        type: Schema.Types.ObjectId,
        ref: "dispensaries",
      },
      valid_upto: {
        type: Date,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
      stripe_subscription_id: {
        type: String,
      },
      invoice_pdf: {
        type: String,
      },
      status: {
        type: String,
        enum: ["active", "cancel"],
        default: "active",
        index: true,
      },
      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
    { timestamps: true, versionKey: false },
  );

  subscriptionSchema.index({ status: 1, isDeleted: 1 });

  subscriptionSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    return obj;
  };

  return mongoose.models.subscriptions || mongoose.model("subscriptions", subscriptionSchema);
};
