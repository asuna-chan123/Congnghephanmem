-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS rentals;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS combo_products;
DROP TABLE IF EXISTS combos;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

-- Categories Table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

-- Products Table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    original_price REAL,
    trial_price_per_day REAL DEFAULT 0.0,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    category_id INTEGER,
    is_try_before_buy INTEGER DEFAULT 0, -- 0 for false, 1 for true
    tags TEXT, -- Comma-separated tags (e.g. 'van-phong,mong-nhe')
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Combos Table
CREATE TABLE combos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    original_price REAL,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0
);

-- Combo Products junction table
CREATE TABLE combo_products (
    combo_id INTEGER,
    product_id INTEGER,
    PRIMARY KEY (combo_id, product_id),
    FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Reviews Table
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Rentals Table (Booked dates)
CREATE TABLE rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    start_date TEXT NOT NULL, -- Format YYYY-MM-DD
    end_date TEXT NOT NULL,   -- Format YYYY-MM-DD
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Cart Items Table
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    product_id INTEGER,
    combo_id INTEGER,
    type TEXT NOT NULL, -- 'buy', 'trial', 'combo'
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, product_id, combo_id, type)
);

-- Favorites Table
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, product_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert Categories
INSERT INTO categories (name, slug) VALUES 
('Điện thoại', 'dien-thoai'),
('Laptop', 'laptop'),
('Máy ảnh', 'may-anh');

-- Insert Products
-- 1. Phones (category_id = 1)
-- Tags: gia-re, chup-anh, hieu-nang, pin-trau, mong-nhe
INSERT INTO products (name, price, original_price, trial_price_per_day, image_url, stock_quantity, category_id, is_try_before_buy, tags) VALUES
('iPhone 15 Pro Max 256GB', 29490000, 34990000, 150000, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60', 12, 1, 1, 'chup-anh,hieu-nang,mong-nhe'),
('Samsung Galaxy S24 Ultra', 26990000, 31990000, 140000, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60', 8, 1, 1, 'chup-anh,hieu-nang,pin-trau'),
('Xiaomi 14 Ultra 5G', 22990000, 24990000, 110000, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60', 5, 1, 1, 'hieu-nang,pin-trau'),
('Google Pixel 8 Pro', 18990000, 21990000, 100000, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60', 3, 1, 1, 'chup-anh,mong-nhe'),
('OnePlus 12 5G', 16490000, 18990000, 80000, 'https://images.unsplash.com/photo-1565849328260-577cf935d500?w=500&auto=format&fit=crop&q=60', 15, 1, 1, 'gia-re,pin-trau,hieu-nang');

-- 2. Laptops (category_id = 2)
-- Tags: van-phong, sang-trong, mong-nhe, do-hoa, choi-game
INSERT INTO products (name, price, original_price, trial_price_per_day, image_url, stock_quantity, category_id, is_try_before_buy, tags) VALUES
('MacBook Pro 14" M3 (8GB/512GB)', 38990000, 42990000, 250000, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60', 7, 2, 1, 'van-phong,sang-trong,mong-nhe,do-hoa'),
('Dell XPS 13 9340 Core Ultra 7', 35490000, 39990000, 220000, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60', 4, 2, 1, 'van-phong,sang-trong,mong-nhe'),
('ASUS ROG Zephyrus G14 OLED', 44990000, 48990000, 300000, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60', 6, 2, 1, 'do-hoa,choi-game,mong-nhe'),
('ThinkPad X1 Carbon Gen 11', 41990000, 45990000, 240000, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60', 9, 2, 1, 'van-phong,sang-trong,mong-nhe'),
('HP Spectre x360 14" OLED', 33990000, 37990000, 200000, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=60', 5, 2, 1, 'van-phong,sang-trong,mong-nhe,do-hoa');

-- 3. Cameras (category_id = 3)
-- Tags: du-lich, chuyen-nghiep, vlog, action-cam, compact
INSERT INTO products (name, price, original_price, trial_price_per_day, image_url, stock_quantity, category_id, is_try_before_buy, tags) VALUES
('Sony Alpha A7 IV (Body Only)', 54990000, 59990000, 350000, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60', 5, 3, 1, 'chuyen-nghiep,vlog,du-lich'),
('Fujifilm X-T5 Mirrorless Camera', 43900000, 47000000, 280000, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&auto=format&fit=crop&q=60', 3, 3, 1, 'chuyen-nghiep,compact,du-lich'),
('Canon EOS R6 Mark II', 58900000, 64000000, 380000, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60', 2, 3, 1, 'chuyen-nghiep,vlog'),
('GoPro Hero 12 Black', 9990000, 11490000, 80000, 'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=500&auto=format&fit=crop&q=60', 18, 3, 1, 'action-cam,du-lich,vlog'),
('DJI Osmo Pocket 3 Creator Combo', 15890000, 17500000, 120000, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60', 10, 3, 1, 'compact,vlog,du-lich');

-- 4. Accessories/Other products (needed for Combos)
INSERT INTO products (name, price, original_price, trial_price_per_day, image_url, stock_quantity, category_id, is_try_before_buy, tags) VALUES
-- For Vlogger/Tiktoker
('Micro cài áo không dây Rode Wireless PRO', 10500000, 11500000, 60000, 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=60', 14, 3, 1, 'vlog'),
('Đèn LED Ring Elgato Ring Light', 4500000, 4990000, 30000, 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=500&auto=format&fit=crop&q=60', 20, 3, 1, 'vlog'),
-- For WFH
('Màn hình LG DualUp 28" Ergonomic SDQ600', 12900000, 14900000, 90000, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60', 6, 2, 1, 'van-phong'),
('Bàn phím cơ công thái học Logitech Ergo K860', 2990000, 3490000, 20000, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60', 12, 2, 1, 'van-phong'),
('Chuột công thái học Logitech MX Master 3S', 2490000, 2990000, 15000, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60', 25, 2, 1, 'van-phong'),
-- For Travel
('Gậy Selfie 3-Way GoPro chính hãng', 1890000, 2190000, 10000, 'https://images.unsplash.com/photo-1622495894254-2101b0f5b9d5?w=500&auto=format&fit=crop&q=60', 30, 3, 1, 'du-lich'),
('Pin dự phòng Anker Prime 20000mAh 200W', 2800000, 3200000, 15000, 'https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=500&auto=format&fit=crop&q=60', 45, 1, 1, 'du-lich');

-- Insert Combos
INSERT INTO combos (name, description, price, original_price, image_url, stock_quantity) VALUES
(
  'Combo Vlogger / Tiktoker chuyên nghiệp', 
  'Giải pháp hoàn hảo cho các nhà sáng tạo nội dung. Bộ sản phẩm kết hợp khả năng quay phim xuất sắc, âm thanh thu âm chất lượng cao và ánh sáng chuẩn studio.', 
  62990000, 
  70390000, 
  'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=500&auto=format&fit=crop&q=60', 
  5
),
(
  'Combo Work From Home (WFH) công thái học', 
  'Tối ưu hóa không gian làm việc của bạn với bộ máy tính màn hình phụ độc đáo và chuột/bàn phím hỗ trợ sức khỏe xương khớp, giúp nâng cao năng suất cả ngày dài.', 
  51990000, 
  57370000, 
  'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=500&auto=format&fit=crop&q=60', 
  4
),
(
  'Combo Du lịch & Phượt hành trình', 
  'Bộ thiết bị bền bỉ lưu giữ mọi khoảnh khắc đáng nhớ trên mọi cung đường. Ghi hình mượt mà, thời lượng pin thoải mái cho cả chuyến đi dài.', 
  12990000, 
  15480000, 
  'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=500&auto=format&fit=crop&q=60', 
  10
);

-- Link products inside combos
INSERT INTO combo_products (combo_id, product_id) VALUES
(1, 11), (1, 16), (1, 17),
(2, 6), (2, 18), (2, 19), (2, 20),
(3, 14), (3, 21), (3, 22);

-- Insert Reviews
INSERT INTO reviews (product_id, user_name, rating, comment) VALUES
(1, 'Nguyễn Văn Nam', 5, 'Điện thoại thuê rất mới, không một vết trầy xước. Phí thuê hợp lý, thủ tục nhanh chóng.'),
(1, 'Trần Thị Mai', 5, 'Dùng thử 3 ngày thấy thích quá nên quyết định mua luôn. Tiện lợi vô cùng!'),
(1, 'Lê Minh Tuấn', 4, 'Chất lượng máy tốt, pin còn 98%. Sẽ tiếp tục thuê ở đây khi đi du lịch.'),
(6, 'Hoàng Minh Anh', 5, 'Macbook dùng mượt mà, hỗ trợ cực tốt cho công việc đồ họa ngắn hạn của mình.'),
(6, 'Phạm Hải Đăng', 4, 'Máy nguyên bản, sạch sẽ. Giá thuê tốt nhất thị trường.'),
(11, 'Vũ Hoàng Nam', 5, 'Sony A7 IV chất lượng đỉnh cao. Đi kèm cả pin sạc đầy đủ. Dịch vụ tuyệt vời.'),
(11, 'Lê Cẩm Tú', 5, 'Phục vụ chu đáo, máy hoạt động hoàn hảo trong suốt sự kiện của tôi.');

-- Insert Rentals
INSERT INTO rentals (product_id, start_date, end_date) VALUES
(1, '2026-06-25', '2026-06-27'),
(6, '2026-06-28', '2026-06-30'),
(11, '2026-06-24', '2026-06-25');
