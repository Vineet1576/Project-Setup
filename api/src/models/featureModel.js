module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const featureSchema = new Schema(
    {
      name: {
        type: String,
      },
      addedBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
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
    },
    { timestamps: true, versionKey: false },
  );

  featureSchema.index({ status: 1, isDeleted: 1 });

  featureSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    return obj;
  };

  return mongoose.models.features || mongoose.model("features", featureSchema);
};
