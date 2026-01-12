require('dotenv').config();
const { pool, query } = require('./db');

// Sample inventory data for mosque
const inventoryItems = [
    {
        name: 'Prayer Rugs',
        sku: 'RUG-001',
        type: 'Religious Items',
        description: 'High-quality prayer rugs for daily prayers',
        rate: 25.00,
        quantity: 50
    },
    {
        name: 'Quran Copies',
        sku: 'BOOK-001',
        type: 'Books',
        description: 'Arabic Quran with English translation',
        rate: 15.00,
        quantity: 100
    },
    {
        name: 'Prayer Beads (Tasbih)',
        sku: 'ITEM-001',
        type: 'Religious Items',
        description: 'Islamic prayer beads for dhikr',
        rate: 5.00,
        quantity: 200
    },
    {
        name: 'Water Bottles',
        sku: 'UTIL-001',
        type: 'Utilities',
        description: 'Reusable water bottles for congregation',
        rate: 3.00,
        quantity: 150
    },
    {
        name: 'Cleaning Supplies',
        sku: 'CLEAN-001',
        type: 'Maintenance',
        description: 'General purpose cleaning supplies',
        rate: 50.00,
        quantity: 20
    },
    {
        name: 'Islamic Wall Art',
        sku: 'DECOR-001',
        type: 'Decoration',
        description: 'Framed Islamic calligraphy art',
        rate: 45.00,
        quantity: 15
    },
    {
        name: 'Ablution Area Supplies',
        sku: 'UTIL-002',
        type: 'Utilities',
        description: 'Towels and supplies for wudu area',
        rate: 30.00,
        quantity: 40
    },
    {
        name: 'Sound System Components',
        sku: 'TECH-001',
        type: 'Equipment',
        description: 'Microphones and speakers for announcements',
        rate: 500.00,
        quantity: 2
    },
    {
        name: 'Folding Chairs',
        sku: 'FURN-001',
        type: 'Furniture',
        description: 'Portable folding chairs for events',
        rate: 20.00,
        quantity: 75
    },
    {
        name: 'First Aid Kit',
        sku: 'SAFE-001',
        type: 'Safety',
        description: 'Complete first aid kit for emergencies',
        rate: 35.00,
        quantity: 5
    }
];

const generateInventory = async () => {
    try {
        console.log('Seeding inventory items...');

        // Get an admin user to associate with items
        const userResult = await query(
            `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
        );
        
        const userId = userResult.rows[0]?.id || null;

        for (const item of inventoryItems) {
            const result = await query(
                `INSERT INTO products (name, sku, type, description, rate, quantity, user_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 ON CONFLICT (sku) DO NOTHING 
                 RETURNING *`,
                [item.name, item.sku, item.type, item.description, item.rate, item.quantity, userId]
            );
            
            if (result.rows.length > 0) {
                console.log(`✅ Created item: ${item.name} (SKU: ${item.sku})`);
            } else {
                console.log(`⚠️  Item already exists: ${item.sku}`);
            }
        }

        // Get inventory statistics
        const statsResult = await query(
            `SELECT 
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity,
                SUM(rate * quantity) as total_value,
                COUNT(DISTINCT type) as total_types
             FROM products`
        );
        
        const stats = statsResult.rows[0];

        console.log(`\n📊 Inventory Summary:`);
        console.log(`=====================`);
        console.log(`Total Items: ${stats.total_items}`);
        console.log(`Total Units: ${stats.total_quantity}`);
        console.log(`Total Value: $${parseFloat(stats.total_value).toFixed(2)}`);
        console.log(`Item Types: ${stats.total_types}`);
        console.log(`\n✅ Inventory seeding completed successfully!`);
        
    } catch (error) {
        console.error('Error generating inventory:', error);
        throw error;
    }
};

const main = async () => {
    try {
        await generateInventory();
        await pool.end();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Seeding failed:', error);
        await pool.end();
        process.exit(1);
    }
};

main();
