import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('🔌 Connected to MongoDB cluster successfully.');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}
