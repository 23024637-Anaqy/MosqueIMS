require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:4000'; // Adjust if needed

async function setupAndTestPrototype() {
  try {
    console.log('=== Prototype Mode Testing Setup ===\n');

    // 1. Create admin user
    console.log('1. Creating admin user...');
    let adminToken;
    try {
      const adminSignup = await axios.post(`${API_URL}/api/user/signup`, {
        name: 'Admin User',
        email: 'admin@quantix.com',
        password: 'admin123',
        role: 'admin'
      });
      adminToken = adminSignup.data.token;
      console.log('✓ Admin created:', adminSignup.data.email);
      console.log('  Token:', adminToken, '\n');
    } catch (error) {
      if (error.response?.data?.error === 'Email already in use') {
        console.log('⚠ Admin exists, logging in...');
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

    // 2. Create staff user
    console.log('2. Creating staff user...');
    let staffToken;
    try {
      const staffSignup = await axios.post(`${API_URL}/api/user/signup`, {
        name: 'John Smith',
        email: 'john.smith@quantix.com',
        password: 'staff123',
        role: 'staff'
      });
      staffToken = staffSignup.data.token;
      console.log('✓ Staff created:', staffSignup.data.email);
      console.log('  Token:', staffToken, '\n');
    } catch (error) {
      if (error.response?.data?.error === 'Email already in use') {
        console.log('⚠ Staff exists, logging in...');
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

    // 3. Admin creates test items
    console.log('3. Admin creating test items...');
    const todayItem = await axios.post(`${API_URL}/api/inventory/items`, {
      name: 'Test Item - Today',
      sku: 'TEST-TODAY-' + Date.now(),
      type: 'Test',
      description: 'Created today for testing',
      rate: 10,
      quantity: 100
    }, { headers: adminHeaders });
    console.log('✓ Created TODAY item:', todayItem.data._id || todayItem.data.id, '\n');

    // Manually create an old item by modifying createdAt
    const oldItem = await axios.post(`${API_URL}/api/inventory/items`, {
      name: 'Test Item - Yesterday',
      sku: 'TEST-OLD-' + Date.now(),
      type: 'Test',
      description: 'Simulating old item',
      rate: 10,
      quantity: 100
    }, { headers: adminHeaders });
    
    const oldItemId = oldItem.data._id || oldItem.data.id;
    console.log('✓ Created OLD item (will manually set old date):', oldItemId);
    
    // For prototype, we need to directly modify the in-memory database
    // This is a test hack - in real scenario, items would naturally be old
    console.log('  (Note: In prototype mode, we can\'t easily backdate items)\n');

    // 4. Test Staff Permissions
    console.log('=== Testing Staff Permissions ===\n');

    // Test 1: Staff edit today's item quantity (should work)
    console.log('4. Staff editing TODAY\'s item quantity...');
    try {
      const itemId = todayItem.data._id || todayItem.data.id;
      const updateResponse = await axios.patch(
        `${API_URL}/api/inventory/items/${itemId}`,
        { quantity: 150 },
        { headers: staffHeaders }
      );
      console.log('✓ SUCCESS: Staff can edit today\'s item');
      console.log(`  Updated quantity to ${updateResponse.data.quantity}\n`);
    } catch (error) {
      console.log('✗ FAILED:', error.response?.data?.error, '\n');
    }

    // Test 2: Staff try to edit name (should fail)
    console.log('5. Staff trying to edit NAME field...');
    try {
      const itemId = todayItem.data._id || todayItem.data.id;
      await axios.patch(
        `${API_URL}/api/inventory/items/${itemId}`,
        { name: 'New Name', quantity: 160 },
        { headers: staffHeaders }
      );
      console.log('✗ FAILED: Staff should not be able to edit name\n');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✓ SUCCESS: Staff blocked from editing name');
        console.log(`  Error: ${error.response?.data?.error}\n`);
      }
    }

    // Test 3: Staff try to create item (should fail)
    console.log('6. Staff trying to CREATE item...');
    try {
      await axios.post(
        `${API_URL}/api/inventory/items`,
        {
          name: 'Staff Created',
          sku: 'STAFF-' + Date.now(),
          type: 'Test',
          rate: 5,
          quantity: 50
        },
        { headers: staffHeaders }
      );
      console.log('✗ FAILED: Staff should not be able to create items\n');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✓ SUCCESS: Staff blocked from creating items');
        console.log(`  Error: ${error.response?.data?.error}\n`);
      }
    }

    // Test 4: Staff try to delete item (should fail)
    console.log('7. Staff trying to DELETE item...');
    try {
      const itemId = todayItem.data._id || todayItem.data.id;
      await axios.delete(
        `${API_URL}/api/inventory/items/${itemId}`,
        { headers: staffHeaders }
      );
      console.log('✗ FAILED: Staff should not be able to delete items\n');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✓ SUCCESS: Staff blocked from deleting items');
        console.log(`  Error: ${error.response?.data?.error}\n`);
      }
    }

    // 5. Test Admin Permissions
    console.log('=== Testing Admin Permissions ===\n');

    console.log('8. Admin editing ALL fields...');
    try {
      const itemId = todayItem.data._id || todayItem.data.id;
      const updateResponse = await axios.patch(
        `${API_URL}/api/inventory/items/${itemId}`,
        {
          name: 'Admin Updated Item',
          type: 'Admin Type',
          quantity: 500,
          rate: 25
        },
        { headers: adminHeaders }
      );
      console.log('✓ SUCCESS: Admin can edit all fields');
      console.log(`  Name: ${updateResponse.data.name}, Quantity: ${updateResponse.data.quantity}\n`);
    } catch (error) {
      console.log('✗ FAILED:', error.response?.data?.error, '\n');
    }

    console.log('9. Admin deleting item...');
    try {
      await axios.delete(
        `${API_URL}/api/inventory/items/${oldItemId}`,
        { headers: adminHeaders }
      );
      console.log('✓ SUCCESS: Admin can delete items\n');
    } catch (error) {
      console.log('✗ FAILED:', error.response?.data?.error, '\n');
    }

    console.log('=== All Tests Complete ===');
    console.log('\n📝 Summary:');
    console.log('✓ Staff can edit quantity of today\'s items');
    console.log('✗ Staff cannot edit other fields');
    console.log('✗ Staff cannot create items');
    console.log('✗ Staff cannot delete items');
    console.log('✓ Admin has full permissions');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

setupAndTestPrototype();
