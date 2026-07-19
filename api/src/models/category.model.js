module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const categorySchema = new Schema(
    {
      name: { type: Array, default: [] },
      type: { type: Array, default: [] },
      nameKey: { type: String, index: true },
      country: { type: Array, default: [] },
      image: { type: String },
      countryKey: { type: String },
      isParent: { type: Boolean, default: false },
      parentId: { type: Schema.Types.ObjectId, ref: "category" },
      status: {
        type: String,
        enum: ["active", "deactive"],
        default: "active",
        index: true,
      },
      addedBy: { type: Schema.Types.ObjectId, ref: "users" },
      isDeleted: { type: Boolean, default: false, index: true },
      deleteAt: { type: Schema.Types.ObjectId, ref: "users" },
    },
    { timestamps: true, versionKey: false },
  );

  categorySchema.index({ status: 1, isDeleted: 1 });
  categorySchema.index({ nameKey: 1, isDeleted: 1 });

  categorySchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    return obj;
  };

  return mongoose.models.category || mongoose.model("category", categorySchema);
};
