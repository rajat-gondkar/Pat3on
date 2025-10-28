/**
 * Database Migration Script
 * Drops the unique index on walletAddress field since we're using custodialWallet.address now
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check existing indexes
    console.log('\n📋 Current indexes:');
    const indexes = await usersCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)}: ${index.name}`);
    });

    // Drop the walletAddress unique index
    console.log('\n🗑️  Dropping walletAddress_1 index...');
    try {
      await usersCollection.dropIndex('walletAddress_1');
      console.log('✅ Index dropped successfully');
    } catch (error) {
      if (error.code === 27) {
        console.log('⚠️  Index does not exist (already dropped)');
      } else {
        throw error;
      }
    }

    // Verify the index is gone
    console.log('\n📋 Indexes after migration:');
    const newIndexes = await usersCollection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)}: ${index.name}`);
    });

    // Show current users
    console.log('\n👥 Current users:');
    const users = await usersCollection.find({}).toArray();
    users.forEach(user => {
      console.log(`  - ${user.email}`);
      console.log(`    walletAddress: ${user.walletAddress || 'null'}`);
      console.log(`    custodialWallet.address: ${user.custodialWallet?.address || 'not set'}`);
      console.log(`    hasCustodialWallet: ${user.hasCustodialWallet}`);
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
