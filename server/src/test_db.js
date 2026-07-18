import 'dotenv/config';
import mongoose from 'mongoose';
import InstagramConnection from './models/InstagramConnection.js';
import User from './models/User.js';

async function test() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");
  
  const connections = await InstagramConnection.find({});
  console.log("CONNECTIONS IN DB:", JSON.stringify(connections, null, 2));
  
  const users = await User.find({});
  console.log("USERS IN DB:", JSON.stringify(users, null, 2));
  
  await mongoose.disconnect();
}

test().catch(console.error);
