import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Do not return password field by default in queries
    },
    role: {
      type: String,
      enum: ['customer', 'manager', 'admin'],
      default: 'customer',
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    addresses: [addressSchema],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    emailOtp: String,
    emailOtpExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * Mongoose Pre-Save Hook:
 * Automatically hashes the password before saving to MongoDB if it was modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance Method: Compare entered plain-text password with hashed password in DB.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance Method: Generate and hash password reset token.
 * Stores the SHA-256 hash in the DB and returns the raw token to send via email.
 */
userSchema.methods.getResetPasswordToken = function () {
  // 1. Generate random 20-byte hex token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // 2. Hash token using SHA-256 and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 3. Set expiration time (15 minutes from now)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

/**
 * Instance Method: Generate a 6-digit numeric Email Verification OTP.
 * Stores the SHA-256 hash in the DB (valid for 10 minutes) and returns the plain 6-digit OTP.
 */
userSchema.methods.generateEmailOTP = function () {
  const otp = String(crypto.randomInt(100000, 1000000));

  this.emailOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.emailOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return otp;
};

const User = mongoose.model('User', userSchema);

export default User;
