require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:4000'; // Adjust if needed

// Using seeded staff user credentials
const STAFF_EMAIL = 'john.smith@quantix.com';
const STAFF_PASSWORD = 'staff123';

async function testStaffTimeframe() {
  try {
    console.log('=== Testing Staff Timeframe Restrictions ===\n');

    // 1. Login as staff
    console.log('1. Logging in as staff...');
    const loginResponse = await axios.post(`${API_URL}/api/user/login`, {
      email: STAFF_EMAIL,
      password: STAFF_PASSWORD
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Logged in successfully\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Get all inventory items
    console.log('2. Fetching inventory items...');
    const inventoryResponse = await axios.get(`${API_URL}/api/inventory/items`, { headers });
    const items = inventoryResponse.data;
    console.log(`✓ Found ${items.length} items\n`);

    if (items.length === 0) {
      console.log('⚠ No items found. Run testTimeframe.js first to create test data.');
      return;
    }

    // 3. Test editing TODAY's item (should succeed)
    console.log('3. Testing edit on TODAY\'s item...');
    const todayItem = items.find(item => item.name.includes('Today'));
    if (todayItem) {
      try {
        const updateResponse = await axios.patch(
          `${API_URL}/api/inventory/items/${todayItem._id}`,
          { quantity: todayItem.quantity + 50 },
          { headers }
        );
        console.log('✓ SUCCESS: Staff can edit today\'s item');
        console.log(`  Updated quantity from ${todayItem.quantity} to ${updateResponse.data.quantity}\n`);
      } catch (error) {
        console.log('✗ FAILED: Should have been allowed');
        console.log(`  Error: ${error.response?.data?.error}\n`);
      }
    }

    // 4. Test editing YESTERDAY's item (should fail)
    console.log('4. Testing edit on YESTERDAY\'s item...');
    const yesterdayItem = items.find(item => item.name.includes('Yesterday'));
    if (yesterdayItem) {
      try {
        await axios.patch(
          `${API_URL}/api/inventory/items/${yesterdayItem._id}`,
          { quantity: yesterdayItem.quantity + 50 },
          { headers }
        );
        console.log('✗ FAILED: Should have been blocked!\n');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✓ SUCCESS: Staff blocked from editing old item');
          console.log(`  Error: ${error.response?.data?.error}\n`);
        } else {
          console.log('✗ Unexpected error:', error.response?.data?.error, '\n');
        }
      }
    }

    // 5. Test editing non-quantity field on TODAY's item (should fail)
    console.log('5. Testing edit of NAME field on today\'s item (should fail)...');
    if (todayItem) {
      try {
        await axios.patch(
          `${API_URL}/api/inventory/items/${todayItem._id}`,
          { name: 'New Name', quantity: todayItem.quantity },
          { headers }
        );
        console.log('✗ FAILED: Should have been blocked!\n');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✓ SUCCESS: Staff blocked from editing name field');
          console.log(`  Error: ${error.response?.data?.error}\n`);
        } else {
          console.log('✗ Unexpected error:', error.response?.data?.error, '\n');
        }
      }
    }

    // 6. Test creating item (should fail)
    console.log('6. Testing create item as staff (should fail)...');
    try {
      await axios.post(
        `${API_URL}/api/inventory/items`,
        {
          name: 'Staff Created Item',
          sku: 'STAFF-TEST',
          type: 'Test',
          rate: 10,
          quantity: 100
        },
        { headers }
      );
      console.log('✗ FAILED: Staff should not be able to create items!\n');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✓ SUCCESS: Staff blocked from creating items');
        console.log(`  Error: ${error.response?.data?.error}\n`);
      } else {
        console.log('✗ Unexpected error:', error.response?.data?.error, '\n');
      }
    }

    // 7. Test deleting item (should fail)
    console.log('7. Testing delete item as staff (should fail)...');
    if (todayItem) {
      try {
        await axios.delete(
          `${API_URL}/api/inventory/items/${todayItem._id}`,
          { headers }
        );
        console.log('✗ FAILED: Staff should not be able to delete items!\n');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✓ SUCCESS: Staff blocked from deleting items');
          console.log(`  Error: ${error.response?.data?.error}\n`);
        } else {
          console.log('✗ Unexpected error:', error.response?.data?.error, '\n');
        }
      }
    }

    console.log('=== Test Complete ===');

  } catch (error) {
    console.error('Test Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testStaffTimeframe();
