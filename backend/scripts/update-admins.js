require('dotenv').config();
const mongoose = require('mongoose');

async function updateAdmins() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // We can directly update the collection without loading the full model, 
    // or we can load the model if we want, but doing it directly is safer and faster.
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('Searching for old admins...');
    const result = await usersCollection.updateMany(
      { role: 'admin', adminRole: { $exists: false } },
      { $set: { adminRole: 'super_admin' } }
    );

    console.log(`Update complete! Modified ${result.modifiedCount} admin users.`);
    
  } catch (error) {
    console.error('Error updating admins:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

updateAdmins();
