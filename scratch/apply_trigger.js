const { query } = require('../src/models/db');

async function applyTrigger() {
  const sql = `
    CREATE OR REPLACE FUNCTION public.handle_rental_order_status_change()
    RETURNS TRIGGER AS $$
    BEGIN
      -- If status changes to 'cancelled' or 'completed'
      IF (NEW.rental_order_status = 'cancelled' OR NEW.rental_order_status = 'completed') THEN
        -- Update device_units to 'available'
        UPDATE public.device_units
        SET current_status = 'available'
        WHERE unit_id IN (
          SELECT rou.unit_id
          FROM public.rental_order_units rou
          JOIN public.rental_order_details rod ON rou.rental_order_detail_id = rod.rental_order_detail_id
          WHERE rod.rental_order_id = NEW.rental_order_id
        );
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_rental_order_status_change ON public.rental_orders;
    
    CREATE TRIGGER trg_rental_order_status_change
    AFTER UPDATE OF rental_order_status ON public.rental_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_rental_order_status_change();
  `;

  try {
    console.log('Applying trigger to Supabase database...');
    await query(sql);
    console.log('Trigger applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to apply trigger:', error);
    process.exit(1);
  }
}

applyTrigger();
