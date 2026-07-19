module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const transactionSchema = new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
      purchased_planId: {
        type: Schema.Types.ObjectId,
        ref: "plans",
      },
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "usd",
      },
      status: {
        type: String,
        enum: ["success", "pending", "failed", "cancelled"],
        default: "pending",
        index: true,
      },
      stripe_session_id: {
        type: String,
      },
      stripe_payment_id: {
        type: String,
      },
      invoiceUrl: {
        type: String,
      },
      type: {
        type: String,
      },
      subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: "subscriptions",
      },
      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
    { timestamps: true, versionKey: false },
  );

  transactionSchema.index({ status: 1, isDeleted: 1 });
  transactionSchema.index({ userId: 1, isDeleted: 1 });

  transactionSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    return obj;
  };

  return mongoose.models.transactions || mongoose.model("transactions", transactionSchema);
};
