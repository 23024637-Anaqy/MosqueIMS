require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:4000'; // Adjust if needed

// Using seeded admin user credentials
const ADMIN_EMAIL = 'admin@quantix.com';
const ADMIN_PASSWORD = 'admin123';

async function testAdminPermissions() {
  try {
    console.log('=== Testing Admin Permissions ===\n');

    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/api/user/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Logged in successfully');
    console.log(`  User: ${loginResponse.data.name} (${loginResponse.data.role})\n`);

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

    // 3. Test creating item (should succeed)
    console.log('3. Testing create item as admin (should succeed)...');
    try {
      const createResponse = await axios.post(
        `${API_URL}/api/inventory/items`,
        {
          name: 'Admin Created Test Item',
          sku: 'ADMIN-TEST-' + Date.now(),
          type: 'Test',
          description: 'Created by admin',
          rate: 15,
          quantity: 200
        },
        { headers }
      );
      console.log('✓ SUCCESS: Admin can create items');
      console.log(`  Created item ID: ${createResponse.data._id}\n`);
      
      const createdItemId = createResponse.data._id;

      // 4. Test editing ALL fields of an item (should succeed)
      console.log('4. Testing edit of ALL fields as admin (should succeed)...');
      try {
        const updateResponse = await axios.patch(
          `${API_URL}/api/inventory/items/${createdItemId}`,
          {
            name: 'Updated Admin Item',
            type: 'Updated Type',
            description: 'Updated description',
            rate: 25,
            quantity: 300
          },
          { headers }
        );
        console.log('✓ SUCCESS: Admin can edit all fields');
        console.log(`  Updated name: ${updateResponse.data.name}`);
        console.log(`  Updated rate: ${updateResponse.data.rate}`);
        console.log(`  Updated quantity: ${updateResponse.data.quantity}\n`);
      } catch (error) {
        console.log('✗ FAILED: Admin should be able to edit all fields');
        console.log(`  Error: ${error.response?.data?.error}\n`);
      }

      // 5. Test editing old items (should succeed)
      console.log('5. Testing edit of OLD item as admin (should succeed)...');
      const oldItem = items.find(item => item.name.includes('Yesterday') || item.name.includes('2 Days'));
      if (oldItem) {
        try {
          const updateResponse = await axios.patch(
            `${API_URL}/api/inventory/items/${oldItem._id}`,
            {
              name: 'Admin Updated Old Item',
              quantity: oldItem.quantity + 100
            },
            { headers }
          );
          console.log('✓ SUCCESS: Admin can edit old items');
          console.log(`  Updated quantity from ${oldItem.quantity} to ${updateResponse.data.quantity}\n`);
        } catch (error) {
          console.log('✗ FAILED: Admin should be able to edit old items');
          console.log(`  Error: ${error.response?.data?.error}\n`);
        }
      } else {
        console.log('⚠ No old item found, skipping this test\n');
      }

      // 6. Test deleting item (should succeed)
      console.log('6. Testing delete item as admin (should succeed)...');
      try {
        await axios.delete(
          `${API_URL}/api/inventory/items/${createdItemId}`,
          { headers }
        );
        console.log('✓ SUCCESS: Admin can delete items');
        console.log(`  Deleted item ID: ${createdItemId}\n`);
      } catch (error) {
        console.log('✗ FAILED: Admin should be able to delete items');
        console.log(`  Error: ${error.response?.data?.error}\n`);
      }

    } catch (error) {
      console.log('✗ FAILED: Admin should be able to create items');
      console.log(`  Error: ${error.response?.data?.error}\n`);
    }

    console.log('=== Admin Test Complete ===');
    console.log('\n📝 Summary: Admin should have full access to:');
    console.log('   ✓ Create items');
    console.log('   ✓ Edit all fields of any item (old or new)');
    console.log('   ✓ Delete items');

  } catch (error) {
    console.error('Test Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAdminPermissions();
