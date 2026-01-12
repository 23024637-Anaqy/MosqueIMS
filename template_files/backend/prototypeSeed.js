const proto = require('./prototypeDb');

let seededUsers = null;

function seedPrototype() {
  // Create admin and staff users
  const admin = proto.createUser({ name: 'Admin User', email: 'admin@example.com', password: 'pass', role: 'admin' });
  const staff = proto.createUser({ name: 'Staff User', email: 'staff@example.com', password: 'pass', role: 'staff' });

  // Store for API access
  seededUsers = { admin, staff };

  console.log('Created users:');
  console.log('Admin token:', admin.id);
  console.log('Staff token:', staff.id);

  // Create sample inventory
  proto.createInventory({ name: 'Prayer Mats', sku: 'PM-001', type: 'Supplies', quantity: 50, rate: 10.0, description: 'Blue prayer mats', createdBy: admin.id });
  proto.createInventory({ name: 'Water Bottles', sku: 'WB-001', type: 'Supplies', quantity: 100, rate: 2.5, description: '500ml bottles', createdBy: staff.id });

  // Create sample document (base64 placeholder)
  const base64Sample = Buffer.from('Sample PDF content').toString('base64');
  proto.createDocument({ title: 'Monthly Inventory Report', fileName: 'report_july.pdf', fileData: base64Sample, fileSize: base64Sample.length, type: 'report', description: 'Prototype report', metadata: { reportType: 'inventory_sales', dateRange: { startDate: '2025-07-01', endDate: '2025-07-31' }, summary: { totalStockAdded: 150 } }, generatedBy: admin.id });

  console.log('Seeded inventory and documents.');
  return { admin, staff };
}

function getSeededUsers() {
  return seededUsers;
}

if (require.main === module) {
  seedPrototype();
}

module.exports = seedPrototype;
module.exports.getSeededUsers = getSeededUsers;
