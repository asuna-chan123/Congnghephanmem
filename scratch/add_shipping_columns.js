const { query } = require('../src/models/db');

async function run() {
  try {
    console.log('Adding shipping columns to rental_orders table...');
    
    // Add columns
    await query(`
      ALTER TABLE public.rental_orders 
      ADD COLUMN IF NOT EXISTS shipping_name character varying,
      ADD COLUMN IF NOT EXISTS shipping_phone character varying,
      ADD COLUMN IF NOT EXISTS shipping_address text;
    `);
    
    console.log('Columns added. Populating existing orders with customer details...');
    
    // Populate existing orders with customer data
    await query(`
      UPDATE public.rental_orders ro
      SET 
        shipping_name = COALESCE(ro.shipping_name, c.full_name),
        shipping_phone = COALESCE(ro.shipping_phone, c.phone_number),
        shipping_address = COALESCE(ro.shipping_address, c.address)
      FROM public.customers c
      WHERE ro.customer_id = c.customer_id 
        AND (ro.shipping_name IS NULL OR ro.shipping_phone IS NULL OR ro.shipping_address IS NULL);
    `);
    
    console.log('Database updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update database schema:', error);
    process.exit(1);
  }
}

run();
