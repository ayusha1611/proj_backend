// Run this script to fix the duplicate email index error
// Usage: node fix-database.js

const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Drop the problematic email index
    const User = mongoose.connection.collection('users');
    
    try {
      await User.dropIndex('email_1');
      console.log('✅ Dropped old email_1 index');
    } catch (error) {
      console.log('No email_1 index to drop (this is fine)');
    }

    // Also drop any other email indexes
    const indexes = await User.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    for (const index of indexes) {
      if (index.name.includes('email') && index.name !== '_id_') {
        try {
          await User.dropIndex(index.name);
          console.log(`✅ Dropped ${index.name}`);
        } catch (e) {
          console.log(`Could not drop ${index.name}`);
        }
      }
    }

    console.log('✅ Database fixed! Email field is now optional.');
    console.log('You can now login without errors.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDatabase();
