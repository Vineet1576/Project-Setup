module.exports = (mongoose) => {
  const { Schema } = mongoose;

  const roleSchema = new Schema(
    {
      name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
        index: true,
      },

      displayName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },

      description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
      },

      permissions: {
        type: [
          {
            type: String,
            trim: true,
          },
        ],
        default: [],
      },

      isSystemRole: {
        type: Boolean,
        default: false,
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

      addedBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

  // Compound Indexes
  roleSchema.index({ name: 1, isDeleted: 1 });
  roleSchema.index({ status: 1, isDeleted: 1 });

  // Hide internal fields
  roleSchema.methods.toJSON = function () {
    const obj = this.toObject();

    obj.id = obj._id;
    delete obj._id;

    return obj;
  };

  return mongoose.models.roles || mongoose.model("roles", roleSchema);
};
