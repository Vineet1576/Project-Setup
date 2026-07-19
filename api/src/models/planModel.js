module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const planSchema = new Schema(
    {
      recommended: {
        type: String,
        enum: ["yes", "no"],
        default: "no",
      },
      name: {
        type: String,
      },
      plan_type: {
        type: String,
        enum: ["free", "premium"],
        default: "free",
      },
      dispensary: {
        type: Schema.Types.ObjectId,
        ref: "dispensaries",
      },
      venues: [
        {
          type: Schema.Types.ObjectId,
          ref: "dispensaries",
        },
      ],
      maxDispensaries: {
        type: Number,
        default: 1,
        required: true,
      },
      numberOfDays: {
        type: Number,
      },
      numberOfDispenseries: {
        type: Number,
      },
      numberOfNotifications: {
        type: Number,
      },
      pricing: {
        type: Array,
        default: [],
      },
      features: [
        {
          type: Schema.Types.ObjectId,
          ref: "features",
        },
      ],
      isActive: {
        type: Boolean,
        default: false,
      },
      stripe_price_id: { type: String },
      stripe_product_id: { type: String },
      isChecked: {
        type: Boolean,
        default: false,
      },
      currencyType: {
        type: String,
      },
      description: { type: String },
      trial_period_days: { type: Number, default: 0 },
      addedBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
      status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
        index: true,
      },
      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
      tournament: {
        type: String,
        default: null,
      },
      type: {
        type: String,
      },
      seriesTournaments: {
        type: String,
        default: null,
      },
      series: {
        type: String,
      },
      seriesFeaturedLimit: {
        type: String,
        default: null,
      },
      tournamentFeaturedLimit: {
        type: String,
        default: null,
      },
    },
    { timestamps: true, versionKey: false },
  );

  planSchema.index({ status: 1, isDeleted: 1 });
  planSchema.index({ plan_type: 1 });

  planSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    return obj;
  };

  return mongoose.models.plans || mongoose.model("plans", planSchema);
};
