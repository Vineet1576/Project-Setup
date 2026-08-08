module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const faqSchema = new Schema(
    {
      category: {
        type: String,
        trim: true,
        required: true,
        index: true,
      },
      question: {
        type: String,
        trim: true,
        required: true,
      },
      answer: {
        type: String,
        trim: true,
        required: true,
      },
      order: {
        type: Number,
        default: 0,
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

  faqSchema.index({ status: 1, isDeleted: 1, category: 1, order: 1 });

  faqSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    return obj;
  };

  return mongoose.models.faqs || mongoose.model("faqs", faqSchema);
};
