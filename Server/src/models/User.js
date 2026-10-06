import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [60, "Name cannot be more than 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot be more than 254 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      // Google-authenticated accounts never set a local password
      required: [function () { return this.authProvider !== "google"; }, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    phone: {
      type: String,
      // Google's ID token carries no phone number — collected later from
      // the account's own Dashboard instead of blocking sign-up on it.
      required: [function () { return this.authProvider !== "google"; }, "Please add a phone number"],
      default: "",
    },
    location: {
      type: String,
      required: [function () { return this.authProvider !== "google"; }, "Please add a location"],
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profileImage: {
      type: String,
      default: "",
    },
    profileImagePublicId: {
      type: String,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      campaignUpdates: { type: Boolean, default: true },
      productDrops: { type: Boolean, default: false },
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    // Bumped whenever every existing session for this user must be
    // invalidated (e.g. a password reset). Every access/refresh token embeds
    // the version it was issued under; a mismatch against the current value
    // rejects the token even though it hasn't expired yet.
    tokenVersion: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.tokenVersion;
  return obj;
};

const User = mongoose.model("User", userSchema);
export default User;
