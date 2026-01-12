require('dotenv').config();
const mongoose = require('mongoose');
const Inventory = require('./models/inventoryModel');

async function setupTestData() {
  try {
    // Use MONGO_URI from .env or fallback to local MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/quantix';
    
    if (!mongoUri || mongoUri === 'undefined') {
      console.error('❌ Error: MONGO_URI not found in .env file');
      console.log('\nPlease uncomment or add MONGO_URI in your .env file:');
      console.log('MONGO_URI=mongodb://localhost:27017/quantix');
      console.log('or');
      console.log('MONGO_URI=your_mongodb_atlas_connection_string');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create an item with today's date
    const todayItem = await Inventory.create({
      name: 'Test Item - Today',
      sku: 'TEST-TODAY-' + Date.now(),
      type: 'Test',
      description: 'Created today for testing',
      rate: 10,
      quantity: 100
    });
    console.log('✓ Created item with today\'s date:', todayItem._id);

    // Create an item and backdate it to yesterday
    const yesterdayItem = await Inventory.create({
      name: 'Test Item - Yesterday',
      sku: 'TEST-YESTERDAY-' + Date.now(),
      type: 'Test',
      description: 'Created yesterday for testing',
      rate: 10,
      quantity: 100
    });
    
    // Manually update the createdAt to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await Inventory.findByIdAndUpdate(yesterdayItem._id, {
      createdAt: yesterday
    });
    console.log('✓ Created item with yesterday\'s date:', yesterdayItem._id);

    // Create an item and backdate it to 2 days ago
    const twoDaysAgoItem = await Inventory.create({
      name: 'Test Item - 2 Days Ago',
      sku: 'TEST-2DAYS-' + Date.now(),
      type: 'Test',
      description: 'Created 2 days ago for testing',
      rate: 10,
      quantity: 100
    });
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    await Inventory.findByIdAndUpdate(twoDaysAgoItem._id, {
      createdAt: twoDaysAgo
    });
    console.log('✓ Created item with 2 days ago date:', twoDaysAgoItem._id);

    console.log('\n=== Test Items Created ===');
    console.log('Today item ID:', todayItem._id);
    console.log('Yesterday item ID:', yesterdayItem._id);
    console.log('2 days ago item ID:', twoDaysAgoItem._id);
    console.log('\nNow test with a STAFF user:');
    console.log('- TODAY item should allow quantity edit ✓');
    console.log('- YESTERDAY item should reject with error ✗');
    console.log('- 2 DAYS AGO item should reject with error ✗');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
  }
}

setupTestData();
