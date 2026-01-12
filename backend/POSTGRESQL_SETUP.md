# PostgreSQL Setup Guide for Mosque IMS

## Prerequisites

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres-mosque -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres`

## Setup Steps

### 1. Create Database

Connect to PostgreSQL and create a database:

```bash
# Connect to PostgreSQL (using psql)
psql -U postgres

# Create database
CREATE DATABASE mosque_ims;

# Connect to the database
\c mosque_ims
```

### 2. Initialize Database Schema

Run the schema creation script:

```bash
# From the backend directory
cd backend
psql -U postgres -d mosque_ims -f database/schema.sql
```

Or if you set `INIT_DB=true` in your `.env` file, the schema will be initialized automatically when you start the server.

### 3. Configure Environment Variables

Create or update `.env` file in the `backend` directory:

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mosque_ims

# Or for more detailed connection:
# DATABASE_URL=postgresql://username:password@host:port/database

# Server Configuration
PORT=4000
SECRET=your_jwt_secret_key_here

# Optional: Set to true to initialize database schema on startup
INIT_DB=true

# Optional: Set to true for prototype mode (in-memory DB)
PROTOTYPE=false
```

### 4. Seed Database

Seed users:
```bash
node seedUsers.js
```

Seed inventory:
```bash
node seedInventoryPG.js
```

## Test Credentials

After seeding, you can log in with:

**Admin Account:**
- Email: `admin@quantix.com`
- Password: `admin123`

**Staff Account:**
- Email: `john.smith@quantix.com`
- Password: `staff123`

## Running the Application

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

## Database Connection String Formats

### Local PostgreSQL
```
postgresql://postgres:password@localhost:5432/mosque_ims
```

### Cloud PostgreSQL (Heroku, AWS RDS, etc.)
```
postgresql://username:password@host.com:5432/database_name?ssl=true
```

### Supabase
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   pg_ctl status
   
   # Linux/Mac
   sudo service postgresql status
   ```

2. **Verify connection:**
   ```bash
   psql -U postgres -d mosque_ims -c "SELECT NOW();"
   ```

3. **Check firewall/ports:**
   - PostgreSQL default port is 5432
   - Ensure it's not blocked by firewall

### Permission Issues

If you get permission errors:
```sql
GRANT ALL PRIVILEGES ON DATABASE mosque_ims TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Reset Database

To start fresh:
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE mosque_ims;"
psql -U postgres -c "CREATE DATABASE mosque_ims;"

# Run schema
psql -U postgres -d mosque_ims -f database/schema.sql

# Seed data
node seedUsers.js
node seedInventoryPG.js
```

## Migration from MongoDB

The application has been fully migrated from MongoDB to PostgreSQL. Key changes:

1. **ID Fields**: Changed from MongoDB ObjectId (string) to PostgreSQL serial (integer)
2. **Timestamps**: Using PostgreSQL TIMESTAMP instead of Mongoose timestamps
3. **Field Names**: Snake_case in database (e.g., `created_at`) vs camelCase in API responses
4. **Relationships**: Using foreign keys instead of MongoDB references

## Production Deployment

For production:

1. Use a managed PostgreSQL service (AWS RDS, Heroku Postgres, Supabase, etc.)
2. Set `INIT_DB=false` in production (only initialize once)
3. Use connection pooling (already configured in db.js)
4. Enable SSL for database connections
5. Regular backups using `pg_dump`:
   ```bash
   pg_dump -U postgres mosque_ims > backup.sql
   ```

## Schema Updates

If you need to modify the schema:

1. Update `backend/database/schema.sql`
2. Create a migration script or manually apply changes
3. Test thoroughly in development first

Example migration script:
```sql
-- Add a new column
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Create an index
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
```
