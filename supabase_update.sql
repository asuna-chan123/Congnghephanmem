-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.equipment_categories (
  category_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  category_name character varying NOT NULL,
  category_image text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT equipment_categories_pkey PRIMARY KEY (category_id)
);
CREATE TABLE public.colors (
  color_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  color_name character varying NOT NULL UNIQUE,
  hex_code character varying,
  CONSTRAINT colors_pkey PRIMARY KEY (color_id)
);
CREATE TABLE public.storage_capacities (
  capacity_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  capacity_value character varying NOT NULL UNIQUE,
  CONSTRAINT storage_capacities_pkey PRIMARY KEY (capacity_id)
);
CREATE TABLE public.devices (
  device_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  device_name character varying NOT NULL,
  manufacturer character varying,
  description text,
  default_image text,
  category_id integer,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT devices_pkey PRIMARY KEY (device_id),
  CONSTRAINT devices_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.equipment_categories(category_id)
);
CREATE TABLE public.device_variants (
  variant_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  device_id integer NOT NULL,
  color_id integer,
  capacity_id integer,
  condition_name character varying NOT NULL DEFAULT 'New'::character varying,
  daily_rental_price numeric NOT NULL CHECK (daily_rental_price >= 0::numeric),
  deposit_amount numeric NOT NULL CHECK (deposit_amount >= 0::numeric),
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT device_variants_pkey PRIMARY KEY (variant_id),
  CONSTRAINT device_variants_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(device_id),
  CONSTRAINT device_variants_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(color_id),
  CONSTRAINT device_variants_capacity_id_fkey FOREIGN KEY (capacity_id) REFERENCES public.storage_capacities(capacity_id)
);
CREATE TABLE public.device_units (
  unit_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  variant_id integer NOT NULL,
  unit_code character varying NOT NULL UNIQUE,
  serial_number character varying UNIQUE,
  imei character varying UNIQUE,
  current_status character varying NOT NULL DEFAULT 'available'::character varying CHECK (current_status::text = ANY (ARRAY['available'::character varying, 'reserved'::character varying, 'rented'::character varying, 'maintenance'::character varying, 'lost'::character varying, 'retired'::character varying]::text[])),
  current_condition character varying DEFAULT 'Good'::character varying,
  purchase_price numeric CHECK (purchase_price IS NULL OR purchase_price >= 0::numeric),
  purchase_date date,
  note text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT device_units_pkey PRIMARY KEY (unit_id),
  CONSTRAINT device_units_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.device_variants(variant_id)
);
CREATE TABLE public.device_images (
  image_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  device_id integer NOT NULL,
  color_id integer,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT device_images_pkey PRIMARY KEY (image_id),
  CONSTRAINT device_images_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(device_id),
  CONSTRAINT device_images_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(color_id)
);
CREATE TABLE public.customers (
  customer_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  full_name character varying NOT NULL,
  phone_number character varying,
  email character varying UNIQUE,
  address text,
  password_hash character varying,
  identity_number character varying,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'locked'::character varying, 'deleted'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customers_pkey PRIMARY KEY (customer_id)
);
CREATE TABLE public.staff (
  staff_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  full_name character varying NOT NULL,
  phone_number character varying,
  email character varying UNIQUE,
  password_hash character varying,
  position_name character varying,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'locked'::character varying, 'deleted'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT staff_pkey PRIMARY KEY (staff_id)
);
CREATE TABLE public.rental_orders (
  rental_order_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  order_code character varying UNIQUE,
  customer_id integer,
  staff_id integer,
  create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  rental_start_date date NOT NULL,
  expected_return_date date NOT NULL,
  rental_order_status character varying DEFAULT 'pending'::character varying CHECK (rental_order_status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  subtotal_amount numeric NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0::numeric),
  deposit_amount numeric NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0::numeric),
  penalty_amount numeric NOT NULL DEFAULT 0 CHECK (penalty_amount >= 0::numeric),
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0::numeric),
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0::numeric),
  payment_status character varying DEFAULT 'unpaid'::character varying CHECK (payment_status::text = ANY (ARRAY['unpaid'::character varying, 'partial_paid'::character varying, 'paid'::character varying, 'refunded'::character varying, 'cancelled'::character varying]::text[])),
  note text,
  CONSTRAINT rental_orders_pkey PRIMARY KEY (rental_order_id),
  CONSTRAINT rental_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT rental_orders_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(staff_id)
);
CREATE TABLE public.rental_order_details (
  rental_order_detail_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  rental_order_id integer NOT NULL,
  variant_id integer NOT NULL,
  rental_days integer NOT NULL CHECK (rental_days > 0),
  rental_quantity integer NOT NULL DEFAULT 1 CHECK (rental_quantity > 0),
  unit_rental_price numeric NOT NULL CHECK (unit_rental_price >= 0::numeric),
  unit_deposit_amount numeric NOT NULL CHECK (unit_deposit_amount >= 0::numeric),
  line_note text,
  CONSTRAINT rental_order_details_pkey PRIMARY KEY (rental_order_detail_id),
  CONSTRAINT rental_order_details_rental_order_id_fkey FOREIGN KEY (rental_order_id) REFERENCES public.rental_orders(rental_order_id),
  CONSTRAINT rental_order_details_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.device_variants(variant_id)
);
CREATE TABLE public.rental_order_units (
  rental_order_unit_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  rental_order_detail_id integer NOT NULL,
  unit_id integer NOT NULL,
  assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rental_order_units_pkey PRIMARY KEY (rental_order_unit_id),
  CONSTRAINT rental_order_units_rental_order_detail_id_fkey FOREIGN KEY (rental_order_detail_id) REFERENCES public.rental_order_details(rental_order_detail_id),
  CONSTRAINT rental_order_units_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.device_units(unit_id)
);
CREATE TABLE public.order_fees (
  order_fee_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  rental_order_id integer NOT NULL,
  fee_type character varying NOT NULL CHECK (fee_type::text = ANY (ARRAY['rental_fee'::character varying, 'deposit'::character varying, 'penalty'::character varying, 'damage_fee'::character varying, 'refund'::character varying, 'discount'::character varying, 'other'::character varying]::text[])),
  description text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT order_fees_pkey PRIMARY KEY (order_fee_id),
  CONSTRAINT order_fees_rental_order_id_fkey FOREIGN KEY (rental_order_id) REFERENCES public.rental_orders(rental_order_id)
);
CREATE TABLE public.payments (
  payment_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  rental_order_id integer NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  payment_method character varying,
  payment_type character varying DEFAULT 'payment'::character varying CHECK (payment_type::text = ANY (ARRAY['payment'::character varying, 'deposit'::character varying, 'penalty'::character varying, 'refund'::character varying]::text[])),
  payment_status character varying DEFAULT 'pending'::character varying CHECK (payment_status::text = ANY (ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'refunded'::character varying]::text[])),
  transaction_code character varying,
  paid_at timestamp without time zone,
  note text,
  CONSTRAINT payments_pkey PRIMARY KEY (payment_id),
  CONSTRAINT payments_rental_order_id_fkey FOREIGN KEY (rental_order_id) REFERENCES public.rental_orders(rental_order_id)
);
CREATE TABLE public.return_records (
  return_record_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  rental_order_id integer,
  staff_id integer,
  actual_return_date timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note text,
  CONSTRAINT return_records_pkey PRIMARY KEY (return_record_id),
  CONSTRAINT return_records_rental_order_id_fkey FOREIGN KEY (rental_order_id) REFERENCES public.rental_orders(rental_order_id),
  CONSTRAINT return_records_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(staff_id)
);
CREATE TABLE public.return_devices (
  return_device_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  return_record_id integer NOT NULL,
  unit_id integer NOT NULL,
  return_condition character varying DEFAULT 'Good'::character varying,
  damage_description text,
  late_days integer DEFAULT 0 CHECK (late_days >= 0),
  penalty_fee numeric DEFAULT 0 CHECK (penalty_fee >= 0::numeric),
  CONSTRAINT return_devices_pkey PRIMARY KEY (return_device_id),
  CONSTRAINT return_devices_return_record_id_fkey FOREIGN KEY (return_record_id) REFERENCES public.return_records(return_record_id),
  CONSTRAINT return_devices_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.device_units(unit_id)
);
CREATE TABLE public.return_device_images (
  image_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  return_device_id integer NOT NULL,
  image_url text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT return_device_images_pkey PRIMARY KEY (image_id),
  CONSTRAINT return_device_images_return_device_id_fkey FOREIGN KEY (return_device_id) REFERENCES public.return_devices(return_device_id)
);
CREATE TABLE public.reviews (
  review_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id integer NOT NULL,
  rental_order_id integer,
  variant_id integer,
  equipment_rating integer CHECK (equipment_rating IS NULL OR equipment_rating >= 1 AND equipment_rating <= 5),
  service_rating integer CHECK (service_rating IS NULL OR service_rating >= 1 AND service_rating <= 5),
  comment text NOT NULL,
  review_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reviews_pkey PRIMARY KEY (review_id),
  CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT reviews_rental_order_id_fkey FOREIGN KEY (rental_order_id) REFERENCES public.rental_orders(rental_order_id),
  CONSTRAINT reviews_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.device_variants(variant_id)
);
CREATE TABLE public.review_replies (
  reply_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  review_id integer NOT NULL,
  customer_id integer,
  staff_id integer,
  reply_content text NOT NULL,
  reply_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT review_replies_pkey PRIMARY KEY (reply_id),
  CONSTRAINT review_replies_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(review_id),
  CONSTRAINT review_replies_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT review_replies_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(staff_id)
);
CREATE TABLE public.cart_items (
  cart_item_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  session_id character varying,
  customer_id integer,
  variant_id integer NOT NULL,
  type character varying NOT NULL DEFAULT 'buy'::character varying,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  rental_start_date date,
  rental_end_date date,
  CONSTRAINT cart_items_pkey PRIMARY KEY (cart_item_id),
  CONSTRAINT cart_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.device_variants(variant_id)
);
CREATE TABLE public.favorites (
  favorite_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  session_id character varying,
  customer_id integer,
  variant_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT favorites_pkey PRIMARY KEY (favorite_id),
  CONSTRAINT favorites_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT favorites_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.device_variants(variant_id)
);
CREATE TABLE public.maintenance_records (
  maintenance_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  unit_id integer NOT NULL,
  staff_id integer,
  maintenance_type character varying,
  description text,
  cost numeric DEFAULT 0 CHECK (cost >= 0::numeric),
  start_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  end_date timestamp without time zone,
  maintenance_status character varying DEFAULT 'open'::character varying CHECK (maintenance_status::text = ANY (ARRAY['open'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  note text,
  CONSTRAINT maintenance_records_pkey PRIMARY KEY (maintenance_id),
  CONSTRAINT maintenance_records_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.device_units(unit_id),
  CONSTRAINT maintenance_records_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(staff_id)
);