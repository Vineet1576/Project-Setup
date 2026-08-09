module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const feedbackSchema = new Schema(
    {
      title: String,
      description: String,
      firstName: String,
      lastName: String,
      fullName: String,
      email: String,
      mobileNo: String,
      image: String,
      address: String,
      message: String,
      topic: { type: String, index: true },
      status: {
        type: String,
        enum: ["read", "unread", "resolved"],
        default: "unread",
        index: true,
      },
      addedBy: { type: Schema.Types.ObjectId, ref: "users" },
      parentFeedback: { type: Schema.Types.ObjectId, ref: "feedback", index: true },
      isDeleted: { type: Boolean, default: false, index: true },
    },
    { timestamps: true, versionKey: false },
  );

  feedbackSchema.index({ status: 1, isDeleted: 1 });

  feedbackSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    return obj;
  };

  return mongoose.models.feedback || mongoose.model("feedback", feedbackSchema);
};