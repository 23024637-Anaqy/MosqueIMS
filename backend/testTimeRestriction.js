const axios = require('axios');

const API_URL = 'http://localhost:4000';

async function testStaffTimeRestriction() {
  try {
    console.log('=== Testing Staff Time-Based Restriction ===\n');

    // 1. Login as admin to create a test item
    console.log('1. Logging in as admin...');
    const adminLogin = await axios.post(`${API_URL}/api/user/login`, {
      email: 'admin@quantix.com',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    console.log('✓ Admin logged in\n');

    // 2. Admin creates an item
    console.log('2. Admin creating test item...');
    const createResponse = await axios.post(
      `${API_URL}/api/inventory/items`,
      {
        name: 'Test Item for Time Restriction',
        sku: 'TIME-TEST-' + Date.now(),
        type: 'Test',
        description: 'Testing time-based editing',
        rate: 10,
        quantity: 100
      },
      { headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
    );
    const itemId = createResponse.data.id || createResponse.data._id;
    console.log('✓ Created item:', itemId);
    console.log('  Created at:', new Date(createResponse.data.createdAt).toLocaleString());
    console.log('\n');

    // 3. Manually modify the createdAt in the prototype DB
    console.log('3. Manually backdating the item...');
    console.log('⚠️  In prototype mode, you need to manually edit the item in the database.');
    console.log('   Since it\'s in-memory, follow these steps:\n');
    console.log('   OPTION A - Use browser console:');
    console.log('   ---------------------------------');
    console.log('   1. Open browser DevTools (F12)');
    console.log('   2. Go to Console tab');
    console.log('   3. Paste and run this code:\n');
    console.log(`      fetch('${API_URL}/api/inventory/items/${itemId}', {`);
    console.log(`        method: 'PATCH',`);
    console.log(`        headers: {`);
    console.log(`          'Authorization': 'Bearer ${adminToken}',`);
    console.log(`          'Content-Type': 'application/json'`);
    console.log(`        },`);
    console.log(`        body: JSON.stringify({`);
    console.log(`          name: 'Test Item for Time Restriction',`);
    console.log(`          sku: '${createResponse.data.sku}',`);
    console.log(`          type: 'Test',`);
    console.log(`          description: 'Testing time-based editing',`);
    console.log(`          rate: 10,`);
    console.log(`          quantity: 100`);
    console.log(`        })`);
    console.log(`      })\n`);
    console.log('   OPTION B - Modify prototypeDb.js temporarily:');
    console.log('   ---------------------------------------------');
    console.log('   Add this helper function to prototypeDb.js:\n');
    console.log(`   const backdateItem = (id, daysAgo) => {`);
    console.log(`     const item = getInventoryById(id);`);
    console.log(`     if (item) {`);
    console.log(`       const date = new Date();`);
    console.log(`       date.setDate(date.getDate() - daysAgo);`);
    console.log(`       item.createdAt = date;`);
    console.log(`     }`);
    console.log(`   };\n`);
    console.log('   Then call it after creating an item.');
    console.log('\n');

    // 4. Login as staff
    console.log('4. Logging in as staff...');
    const staffLogin = await axios.post(`${API_URL}/api/user/login`, {
      email: 'john.smith@quantix.com',
      password: 'staff123'
    });
    const staffToken = staffLogin.data.token;
    console.log('✓ Staff logged in\n');

    // 5. Staff try to edit the item (should work for today's item)
    console.log('5. Staff editing today\'s item (should work)...');
    try {
      await axios.patch(
        `${API_URL}/api/inventory/items/${itemId}`,
        { quantity: 150 },
        { headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' } }
      );
      console.log('✓ SUCCESS: Staff can edit today\'s item\n');
    } catch (error) {
      console.log('✗ FAILED:', error.response?.data?.error, '\n');
    }

    console.log('\n=== To test "old item" restriction ===');
    console.log('After backdating the item using one of the options above:');
    console.log('Run this command to test staff editing old item:\n');
    console.log(`curl -X PATCH ${API_URL}/api/inventory/items/${itemId} \\`);
    console.log(`  -H "Authorization: Bearer ${staffToken}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"quantity": 200}'\n`);
    console.log('Expected: 403 error - "Staff can only edit items on the same day they were created"\n');

    console.log('\n📝 Item Details for Testing:');
    console.log(`Item ID: ${itemId}`);
    console.log(`Admin Token: ${adminToken}`);
    console.log(`Staff Token: ${staffToken}`);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testStaffTimeRestriction();
