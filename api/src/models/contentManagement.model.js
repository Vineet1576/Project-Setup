module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const contentSchema = new Schema(
    {
      title: {
        type: String,
        enum: [
          "contact us",
          "about us",
          "privacy policy",
          "cookie policy",
          "term condition",
        ],
        required: true,
        trim: true,
      },
      image: { type: Array, default: [], trim: true },
      slug: {
        type: String,
        trim: true,
        unique: true,
        index: true,
      },
      type: { type: String, trim: true },
      description: { type: String },
      meta_title: { type: String, trim: true },
      meta_description: { type: String, trim: true },
      meta_key: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
      videos: [
        {
          url: { type: String, trim: true },
          title: { type: String, trim: true },
        },
      ],
      status: {
        type: String,
        enum: ["active", "deactive"],
        default: "active",
        index: true,
      },
      addedBy: { type: Schema.Types.ObjectId, ref: "users" },
      updatedBy: { type: Schema.Types.ObjectId, ref: "users" },
      isDeleted: { type: Boolean, default: false, index: true },
    },
    { timestamps: true, versionKey: false },
  );

  contentSchema.index({ status: 1, isDeleted: 1 });
  contentSchema.index({ slug: 1 });

  contentSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    return obj;
  };

  return mongoose.models.contentManagement || mongoose.model("contentManagement", contentSchema);
};
