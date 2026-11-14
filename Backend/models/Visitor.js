import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
      index: true,
    },
    visitCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    deviceType: {
      type: String,
      enum: ['Mobile', 'Tablet', 'Desktop'],
      default: 'Desktop',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    lastPath: {
      type: String,
      default: '/',
    },
    firstVisitedAt: {
      type: Date,
      default: Date.now,
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Visitor = mongoose.model('Visitor', visitorSchema);

export default Visitor;
