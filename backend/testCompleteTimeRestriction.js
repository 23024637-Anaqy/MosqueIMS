const axios = require('axios');
const { backdateInventoryItem } = require('./prototypeDb');

const API_URL = 'http://localhost:4000';

async function fullTimeRestrictionTest() {
  try {
    console.log('=== Complete Time-Based Permission Test ===\n');

    // 1. Create/Login as admin
    console.log('Step 1: Creating/Login as admin...');
    let adminToken;
    try {
      const adminSignup = await axios.post(`${API_URL}/api/user/signup`, {
        name: 'Admin User',
        email: 'admin@quantix.com',
        password: 'admin123',
        role: 'admin'
      });
      adminToken = adminSignup.data.token;
      console.log('✓ Admin created\n');
    } catch (error) {
      if (error.response?.data?.error === 'Email already in use') {
        const adminLogin = await axios.post(`${API_URL}/api/user/login`, {
          email: 'admin@quantix.com',
          password: 'admin123'
        });
        adminToken = adminLogin.data.token;
        console.log('✓ Admin logged in\n');
      } else {
        throw error;
      }
    }

    // 2. Create/Login as staff
    console.log('Step 2: Creating/Login as staff...');
    let staffToken;
    try {
      const staffSignup = await axios.post(`${API_URL}/api/user/signup`, {
        name: 'John Smith',
        email: 'john.smith@quantix.com',
        password: 'staff123',
        role: 'staff'
      });
      staffToken = staffSignup.data.token;
      console.log('✓ Staff created\n');
    } catch (error) {
      if (error.response?.data?.error === 'Email already in use') {
        const staffLogin = await axios.post(`${API_URL}/api/user/login`, {
          email: 'john.smith@quantix.com',
          password: 'staff123'
        });
        staffToken = staffLogin.data.token;
        console.log('✓ Staff logged in\n');
      } else {
        throw error;
      }
    }

    const adminHeaders = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
    const staffHeaders = { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' };

    // 3. Admin creates a TODAY item
    console.log('Step 3: Admin creating TODAY\'s item...');
    const todayItem = await axios.post(
      `${API_URL}/api/inventory/items`,
      {
        name: 'Today Item',
        sku: 'TODAY-' + Date.now(),
        type: 'Test',
        description: 'Created today',
        rate: 10,
        quantity: 100
      },
      { headers: adminHeaders }
    );
    const todayItemId = todayItem.data.id || todayItem.data._id;
    console.log('✓ Created today item:', todayItemId);
    console.log('  Created at:', new Date(todayItem.data.createdAt).toLocaleString(), '\n');

    // 4. Admin creates an OLD item (will be backdated)
    console.log('Step 4: Admin creating item (will be backdated)...');
    const oldItem = await axios.post(
      `${API_URL}/api/inventory/items`,
      {
        name: 'Yesterday Item',
        sku: 'OLD-' + Date.now(),
        type: 'Test',
        description: 'Will be backdated',
        rate: 10,
        quantity: 100
      },
      { headers: adminHeaders }
    );
    const oldItemId = oldItem.data.id || oldItem.data._id;
    console.log('✓ Created item:', oldItemId);
    
    // Backdate it using the helper function
    console.log('  Backdating to yesterday...');
    backdateInventoryItem(oldItemId, 1);
    console.log('');

    // 5. Staff edit TODAY's item (should work)
    console.log('Step 5: Staff editing TODAY\'s item quantity...');
    try {
      const updateResponse = await axios.patch(
        `${API_URL}/api/inventory/items/${todayItemId}`,
        { quantity: 150 },
        { headers: staffHeaders }
      );
      console.log('✓ SUCCESS: Staff can edit today\'s item');
      console.log(`  Updated quantity from 100 to ${updateResponse.data.quantity}\n`);
    } catch (error) {
      console.log('✗ FAILED: Staff should be able to edit today\'s item');
      console.log(`  Error: ${error.response?.data?.error}\n`);
    }

    // 6. Staff edit YESTERDAY's item (should fail)
    console.log('Step 6: Staff editing YESTERDAY\'s item quantity...');
    try {
      await axios.patch(
        `${API_URL}/api/inventory/items/${oldItemId}`,
        { quantity: 200 },
        { headers: staffHeaders }
      );
      console.log('✗ FAILED: Staff should NOT be able to edit old items\n');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✓ SUCCESS: Staff blocked from editing old item');
        console.log(`  Error: ${error.response?.data?.error}\n`);
      } else {
        console.log('✗ Unexpected error:', error.response?.data?.error, '\n');
      }
    }

    // 7. Staff try to edit other fields on TODAY's item (should fail)
    console.log('Step 7: Staff trying to edit NAME on today\'s item...');
    try {
      await axios.patch(
        `${API_URL}/api/inventory/items/${todayItemId}`,
        { name: 'Staff Changed Name', quantity: 160 },
        { headers: staffHeaders }
      );
      console.log('✗ FAILED: Staff should NOT be able to edit name field\n');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✓ SUCCESS: Staff blocked from editing name');
        console.log(`  Error: ${error.response?.data?.error}\n`);
      } else {
        console.log('✗ Unexpected error:', error.response?.data?.error, '\n');
      }
    }

    // 8. Admin edit YESTERDAY's item (should work)
    console.log('Step 8: Admin editing YESTERDAY\'s item...');
    try {
      const updateResponse = await axios.patch(
        `${API_URL}/api/inventory/items/${oldItemId}`,
        { 
          name: 'Admin Updated Old Item',
          quantity: 500 
        },
        { headers: adminHeaders }
      );
      console.log('✓ SUCCESS: Admin can edit old items');
      console.log(`  Updated name and quantity\n`);
    } catch (error) {
      console.log('✗ FAILED: Admin should be able to edit old items');
      console.log(`  Error: ${error.response?.data?.error}\n`);
    }

    console.log('=== Test Complete ===\n');
    console.log('📊 Summary:');
    console.log('✓ Staff CAN edit quantity of today\'s items');
    console.log('✗ Staff CANNOT edit quantity of old items (403 forbidden)');
    console.log('✗ Staff CANNOT edit other fields like name (403 forbidden)');
    console.log('✓ Admin CAN edit any field of any item (old or new)');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Wait a bit for server to be ready
setTimeout(() => {
  fullTimeRestrictionTest();
}, 1000);
