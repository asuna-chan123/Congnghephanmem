const { query } = require('../src/models/db');

async function main() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'customers'
    `);
    console.log('Columns in customers table:', res);
  } catch (err) {
    console.error(err);
  }
}

main();
