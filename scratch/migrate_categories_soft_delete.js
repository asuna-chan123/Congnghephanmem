const { query } = require('../src/models/db');

async function migrate() {
  try {
    console.log('Adding is_active and deleted_at to equipment_categories...');
    await query('ALTER TABLE equipment_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE');
    await query('ALTER TABLE equipment_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP');
    await query('UPDATE equipment_categories SET is_active = TRUE WHERE is_active IS NULL');
    
    const cols = await query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'equipment_categories' ORDER BY ordinal_position ASC"
    );
    console.log('Updated columns:', cols);
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
