const { query } = require('../src/models/db');

async function main() {
  try {
    await query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS identity_image_front text,
      ADD COLUMN IF NOT EXISTS identity_image_back text
    `);
    console.log('Successfully added identity columns to customers table!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to update DB:', err);
    process.exit(1);
  }
}

main();
