const { query } = require('../src/models/db');

async function main() {
  try {
    const tables = [
      { table: 'devices', pk: 'device_id' },
      { table: 'device_variants', pk: 'variant_id' },
      { table: 'device_images', pk: 'image_id' },
      { table: 'device_units', pk: 'unit_id' },
      { table: 'equipment_categories', pk: 'category_id' },
      { table: 'colors', pk: 'color_id' },
      { table: 'storage_capacities', pk: 'capacity_id' },
      { table: 'customers', pk: 'customer_id' },
      { table: 'rental_orders', pk: 'rental_order_id' },
      { table: 'payments', pk: 'payment_id' }
    ];

    for (const t of tables) {
      try {
        const maxRes = await query(`SELECT COALESCE(MAX(${t.pk}), 0) AS max_id FROM ${t.table}`);
        const maxId = parseInt(maxRes[0].max_id, 10);
        console.log(`Table ${t.table}: MAX(${t.pk}) = ${maxId}`);
        if (maxId > 0) {
          // Restart identity sequence
          await query(`SELECT setval(pg_get_serial_sequence($1, $2), $3, true)`, [t.table, t.pk, maxId]);
          console.log(`  -> Synced sequence for ${t.table}.${t.pk} to ${maxId}`);
        }
      } catch (err) {
        console.log(`  -> Skip ${t.table}: ${err.message}`);
      }
    }
    console.log('Sequence sync completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
