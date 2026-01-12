require('dotenv').config();
const { query } = require('../db');

async function main() {
  const daysAgo = Number(process.argv[2] || 1);
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);

  const nameDate = createdAt.toISOString().slice(0, 10);
  const name = `Backdated Test Item ${nameDate}`;
  const sku = `BACKTEST-${Date.now()}`; // keep unique per run
  const type = 'test';
  const description = `Backdated test item created ${daysAgo} day(s) ago`;
  const rate = 10;
  const quantity = 5;
  const userId = null; // adjust if you want to attribute to a specific user

  try {
    const insertSql = `
      INSERT INTO products (name, sku, type, description, rate, quantity, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      RETURNING *
    `;

    const result = await query(insertSql, [
      name,
      sku,
      type,
      description,
      rate,
      quantity,
      userId,
      createdAt,
    ]);

    console.log('Inserted backdated item:', result.rows[0]);
  } catch (err) {
    console.error('Failed to insert backdated item:', err);
    process.exit(1);
  }
}

main();
