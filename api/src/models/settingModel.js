module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const settingSchema = new Schema(
    {
      key: { type: String, default: "global", unique: true },
      site: {
        siteName: { type: String, trim: true, default: "" },
        tagline: { type: String, trim: true, default: "" },
        logoUrl: { type: String, trim: true, default: "" },
        supportEmail: { type: String, trim: true, default: "" },
        contactEmail: { type: String, trim: true, default: "" },
        contactPhone: { type: String, trim: true, default: "" },
        contactPhoneCode: { type: String, trim: true, default: "" },
        address: { type: String, trim: true, default: "" },
        state: { type: String, trim: true, default: "" },
        country: { type: String, trim: true, default: "" },
        pinCode: { type: String, trim: true, default: "" },


        socialLinks: {
          facebook: { type: String, trim: true, default: "" },
          twitter: { type: String, trim: true, default: "" },
          instagram: { type: String, trim: true, default: "" },
          linkedin: { type: String, trim: true, default: "" },
          youtube: { type: String, trim: true, default: "" },
          github: { type: String, trim: true, default: "" },
        },
      },
      email: {
        fromName: { type: String, trim: true, default: "" },
        fromEmail: { type: String, trim: true, default: "" },
        smtpHost: { type: String, trim: true, default: "" },
        smtpPort: { type: Number, default: 587 },
        smtpUser: { type: String, trim: true, default: "" },
        smtpPassword: { type: String, default: "" },
        smtpSecure: { type: Boolean, default: false },
      },
      stripe: {
        mode: { type: String, enum: ["test", "live"], default: "test" },
        test: {
          publishableKey: { type: String, trim: true, default: "" },
          secretKey: { type: String, default: "" },
          webhookSecret: { type: String, default: "" },
        },
        live: {
          publishableKey: { type: String, trim: true, default: "" },
          secretKey: { type: String, default: "" },
          webhookSecret: { type: String, default: "" },
        },
        currency: { type: String, trim: true, default: "usd" },
      },
      updatedBy: { type: Schema.Types.ObjectId, ref: "users" },
    },
    { timestamps: true, versionKey: false },
  );

  settingSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    return obj;
  };

  return mongoose.models.settings || mongoose.model("settings", settingSchema);
};
