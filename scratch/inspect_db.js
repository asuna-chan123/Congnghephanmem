const { query } = require('../src/models/db');

async function main() {
  try {
    const tables = ['devices', 'device_variants', 'equipment_categories', 'customers', 'rental_orders', 'payments'];
    for (const table of tables) {
      const cols = await query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      console.log(`\n=== TABLE: ${table} ===`);
      console.table(cols);
    }
    
    // Sample variant row
    const sampleVar = await query(`SELECT * FROM device_variants LIMIT 2`);
    console.log('\n=== SAMPLE device_variants ===', sampleVar);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
