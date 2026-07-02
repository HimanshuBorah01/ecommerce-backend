import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    phone: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      maxlength: [128, "Password must not exceed 128 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "seller"],
      default: "user",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "users",
  },
);

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

const userModel = mongoose.model("User", userSchema);

export default userModel;
