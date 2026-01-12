require('dotenv').config();
const { pool, query } = require('./db');
const bcrypt = require('bcrypt');

const generateUsers = async () => {
    try {
        console.log('Seeding users...');

        // Delete all existing users first
        await query('DELETE FROM users');
        console.log('🗑️  Deleted all existing users');

        const usersToCreate = [
            {
                name: 'Admin User',
                email: 'admin1',
                password: 'sultanadmin123',
                role: 'admin'
            },
            {
                name: 'Staff User',
                email: 'staff1',
                password: 'sultanstaff123',
                role: 'staff'
            }
        ];

        // Create users
        const createdUsers = [];
        for (const userData of usersToCreate) {
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            // Insert user
            const result = await query(
                `INSERT INTO users (name, email, password, role) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING *`,
                [userData.name, userData.email, hashedPassword, userData.role]
            );
            
            if (result.rows.length > 0) {
                console.log(`✅ Created user: ${userData.name} (${userData.email}) - Password: ${userData.password}`);
                createdUsers.push(result.rows[0]);
            }
        }

        // Get user counts
        const statsResult = await query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) as staff
             FROM users`
        );
        
        const stats = statsResult.rows[0];

        console.log(`\n📊 User Summary:`);
        console.log(`====================`);
        console.log(`Total Users in DB: ${stats.total}`);
        console.log(`Admin Users: ${stats.admins}`);
        console.log(`Staff Users: ${stats.staff}`);
        console.log(`\n🔐 Login Credentials:`);
        console.log(`Admin: admin@quantix.com / admin123`);
        console.log(`Staff: john.smith@quantix.com / staff123`);
        console.log(`       sarah.johnson@quantix.com / staff123`);
        console.log(`       mike.davis@quantix.com / staff123`);
        console.log(`       emily.chen@quantix.com / staff123`);
        console.log(`       david.wilson@quantix.com / staff123`);
        console.log(`\n✅ User seeding completed successfully!`);
        
    } catch (error) {
        console.error('Error generating users:', error);
        throw error;
    }
};

const main = async () => {
    try {
        await generateUsers();
        await pool.end();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Seeding failed:', error);
        await pool.end();
        process.exit(1);
    }
};

main();
