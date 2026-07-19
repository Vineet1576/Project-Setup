module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const contactUsSchema = new Schema(
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
      status: {
        type: String,
        enum: ["read", "unread"],
        default: "unread",
        index: true,
      },
      addedBy: { type: Schema.Types.ObjectId, ref: "users" },
      isDeleted: { type: Boolean, default: false, index: true },
    },
    { timestamps: true, versionKey: false },
  );

  contactUsSchema.index({ status: 1, isDeleted: 1 });

  contactUsSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    return obj;
  };

  return mongoose.models.contactUs || mongoose.model("contactUs", contactUsSchema);
};
