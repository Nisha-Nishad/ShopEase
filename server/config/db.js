import mongoose from 'mongoose';

/**
 * Connects the Express server to MongoDB using Mongoose.
 * Reads MONGO_URI from environment variables (.env).
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Exit process with failure if DB cannot connect
    process.exit(1);
  }
};

export default connectDB;
