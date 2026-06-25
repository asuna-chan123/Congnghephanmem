-- Drop tables if they exist to start fresh (PostgreSQL syntax)
DROP TABLE IF EXISTS "favorites" CASCADE;
DROP TABLE IF EXISTS "cart_items" CASCADE;
DROP TABLE IF EXISTS "combo_products" CASCADE;
DROP TABLE IF EXISTS "combos" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "ReturnDevice" CASCADE;
DROP TABLE IF EXISTS "ReturnRecord" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "RentalOrderDetail" CASCADE;
DROP TABLE IF EXISTS "RentalOrder" CASCADE;
DROP TABLE IF EXISTS "Staff" CASCADE;
DROP TABLE IF EXISTS "Customer" CASCADE;
DROP TABLE IF EXISTS "Device_Image" CASCADE;
DROP TABLE IF EXISTS "Device_Variant" CASCADE;
DROP TABLE IF EXISTS "Device" CASCADE;
DROP TABLE IF EXISTS "Equipment_Category" CASCADE;

-- 1. Equipment_Category Table
CREATE TABLE "Equipment_Category" (
    "CategoryId" SERIAL PRIMARY KEY,
    "CategoryName" VARCHAR(255) NOT NULL
);

-- 2. Device Table (Thông tin chung của thiết bị)
CREATE TABLE "Device" (
    "DeviceID" INT PRIMARY KEY,
    "DeviceName" VARCHAR(255) NOT NULL,
    "Manufacturer" VARCHAR(255),
    "Description" TEXT,
    "Image" TEXT, -- Ảnh đại diện chính của dòng máy
    "CategoryId" INT REFERENCES "Equipment_Category"("CategoryId") ON DELETE SET NULL
);

-- 3. Device_Variant Table (Các phiên bản cấu hình chi tiết)
CREATE TABLE "Device_Variant" (
    "VariantID" SERIAL PRIMARY KEY,
    "DeviceID" INT REFERENCES "Device"("DeviceID") ON DELETE CASCADE,
    "Condition" VARCHAR(100) NOT NULL, -- Ví dụ: 'New', 'Used'
    "Color" VARCHAR(100), -- Ví dụ: 'Bạc', 'Cam', 'Xanh'
    "StorageCapacity" VARCHAR(100), -- Ví dụ: '256GB', '512GB', 'Chỉ Body', 'Kèm Lens'
    "DailyRentalPrice" DECIMAL(12, 2) NOT NULL,
    "DepositAmount" DECIMAL(12, 2) NOT NULL,
    "Quantity" INT DEFAULT 0,
    "DeviceStatus" VARCHAR(100) DEFAULT 'Available'
);

-- 4. Device_Image Table (Lưu nhiều ảnh của sản phẩm theo DeviceID và phân loại theo Color)
CREATE TABLE "Device_Image" (
    "ImageId" SERIAL PRIMARY KEY,
    "DeviceID" INT REFERENCES "Device"("DeviceID") ON DELETE CASCADE,
    "Color" VARCHAR(100), -- Thêm cột màu sắc của bức ảnh
    "ImageURL" TEXT NOT NULL,
    "IsPrimary" BOOLEAN DEFAULT FALSE
);

-- 5. Customer Table
CREATE TABLE "Customer" (
    "CustomerID" SERIAL PRIMARY KEY,
    "FullName" VARCHAR(255) NOT NULL,
    "PhoneNumber" VARCHAR(20),
    "Email" VARCHAR(255) UNIQUE,
    "Address" TEXT,
    "Password" VARCHAR(255),
    "IdentityNumber" VARCHAR(50)
);

-- 6. Staff Table
CREATE TABLE "Staff" (
    "StaffID" SERIAL PRIMARY KEY,
    "FullName" VARCHAR(255) NOT NULL,
    "PhoneNumber" VARCHAR(20),
    "Email" VARCHAR(255) UNIQUE,
    "Password" VARCHAR(255),
    "Position" VARCHAR(100)
);

-- 7. RentalOrder Table
CREATE TABLE "RentalOrder" (
    "RentalOrderID" SERIAL PRIMARY KEY,
    "CreateDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "RentalStartDate" DATE NOT NULL,
    "ExpectedReturnDate" DATE NOT NULL,
    "RentalOrderStatus" VARCHAR(100) DEFAULT 'Pending',
    "CustomerID" INT REFERENCES "Customer"("CustomerID") ON DELETE SET NULL,
    "StaffID" INT REFERENCES "Staff"("StaffID") ON DELETE SET NULL
);

-- 8. RentalOrderDetail Table
CREATE TABLE "RentalOrderDetail" (
    "RentalOrderID" INT REFERENCES "RentalOrder"("RentalOrderID") ON DELETE CASCADE,
    "VariantID" INT REFERENCES "Device_Variant"("VariantID") ON DELETE CASCADE,
    "RentalDays" INT NOT NULL,
    "UnitRentalPrice" DECIMAL(12, 2) NOT NULL,
    "RentalQuantity" INT NOT NULL DEFAULT 1,
    PRIMARY KEY ("RentalOrderID", "VariantID")
);

-- 9. Invoice Table
CREATE TABLE "Invoice" (
    "InvoiceID" SERIAL PRIMARY KEY,
    "PaymentDate" TIMESTAMP,
    "PaymentMethod" VARCHAR(100),
    "PaymentStatus" VARCHAR(100),
    "RentalOrderID" INT REFERENCES "RentalOrder"("RentalOrderID") ON DELETE CASCADE
);

-- 10. ReturnRecord Table
CREATE TABLE "ReturnRecord" (
    "ReturnRecordID" SERIAL PRIMARY KEY,
    "ActualReturnDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "RentalOrderID" INT REFERENCES "RentalOrder"("RentalOrderID") ON DELETE SET NULL,
    "StaffID" INT REFERENCES "Staff"("StaffID") ON DELETE SET NULL
);

-- 11. ReturnDevice Table (Thiết bị hoàn trả)
CREATE TABLE "ReturnDevice" (
    "ReturnRecordID" INT REFERENCES "ReturnRecord"("ReturnRecordID") ON DELETE CASCADE,
    "VariantID" INT REFERENCES "Device_Variant"("VariantID") ON DELETE CASCADE,
    "PenaltyFee" DECIMAL(12, 2) DEFAULT 0.00,
    "LateDays" INT DEFAULT 0,
    PRIMARY KEY ("ReturnRecordID", "VariantID")
);

-- 12. Review Table
CREATE TABLE "Review" (
    "ReviewID" SERIAL PRIMARY KEY,
    "CustomerID" INT REFERENCES "Customer"("CustomerID") ON DELETE SET NULL,
    "RentalOrderID" INT REFERENCES "RentalOrder"("RentalOrderID") ON DELETE SET NULL,
    "VariantID" INT REFERENCES "Device_Variant"("VariantID") ON DELETE CASCADE,
    "EquipmentRating" INT CHECK ("EquipmentRating" >= 1 AND "EquipmentRating" <= 5),
    "ServiceRating" INT CHECK ("ServiceRating" >= 1 AND "ServiceRating" <= 5),
    "Comment" TEXT,
    "ReviewDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Combos Table (Hỗ trợ gói nhu cầu từ giao diện cũ)
CREATE TABLE "combos" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12, 2) NOT NULL,
    "original_price" DECIMAL(12, 2),
    "image_url" TEXT,
    "stock_quantity" INT DEFAULT 0
);

-- 14. Combo Products junction table (Hỗ trợ liên kết sản phẩm trong gói)
CREATE TABLE "combo_products" (
    "combo_id" INT REFERENCES "combos"("id") ON DELETE CASCADE,
    "variant_id" INT REFERENCES "Device_Variant"("VariantID") ON DELETE CASCADE,
    PRIMARY KEY ("combo_id", "variant_id")
);

-- 15. Cart Items Table (Hỗ trợ giỏ hàng web hiện tại)
CREATE TABLE "cart_items" (
    "id" SERIAL PRIMARY KEY,
    "session_id" VARCHAR(255) NOT NULL,
    "variant_id" INT REFERENCES "Device_Variant"("VariantID") ON DELETE CASCADE,
    "combo_id" INT REFERENCES "combos"("id") ON DELETE CASCADE,
    "type" VARCHAR(50) NOT NULL, -- 'buy', 'trial', 'combo'
    "quantity" INT DEFAULT 1,
    "added_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("session_id", "variant_id", "combo_id", "type")
);

-- 16. Favorites Table (Hỗ trợ yêu thích của web hiện tại)
CREATE TABLE "favorites" (
    "id" SERIAL PRIMARY KEY,
    "session_id" VARCHAR(255) NOT NULL,
    "variant_id" INT REFERENCES "Device_Variant"("VariantID") ON DELETE CASCADE,
    "added_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("session_id", "variant_id")
);


-- ==========================================
-- INSERT DEMO DATA
-- ==========================================

-- Insert Equipment_Category
INSERT INTO "Equipment_Category" ("CategoryId", "CategoryName") VALUES 
(1, 'Điện thoại'),
(2, 'Laptop'),
(3, 'Máy ảnh');

-- Insert Device (Thông tin chung của thiết bị)
INSERT INTO "Device" ("DeviceID", "DeviceName", "Manufacturer", "Description", "Image", "CategoryId") VALUES
-- Phones (CategoryId = 1)
(1, 'iPhone 15 Pro Max', 'Apple', 'Thiết bị di động cao cấp nhất của Apple năm 2023 với khung Titan siêu nhẹ.', 'https://tebkpmtbzythtjowdvak.supabase.co/storage/v1/object/sign/images/iphone-17-pro-max-bac-1-639174801710729848-750x500.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82OTE1YmQ1My1iZjYyLTQwZmYtODdmZS0yYjQxMjYyMWY4M2YiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvaXBob25lLTE3LXByby1tYXgtYmFjLTEtNjM5MTc0ODAxNzEwNzI5ODQ4LTc1MHg1MDAuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MjM2OTY3NiwiZXhwIjoxODEzOTA1Njc2fQ.0EtxRGlZNqcaUA5enm9wrOPnOPQ_tTUTafu_a7xAR0w', 1),
(2, 'Samsung Galaxy S24 Ultra', 'Samsung', 'Flagship đỉnh cao của Samsung trang bị bút S-Pen và tính năng Galaxy AI thông minh.', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60', 1),
(3, 'Xiaomi 14 Ultra 5G', 'Xiaomi', 'Quái thú chụp ảnh hợp tác cùng Leica với cảm biến 1 inch đỉnh cao.', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60', 1),
(4, 'Google Pixel 8 Pro', 'Google', 'Trải nghiệm Android thuần khiết cùng camera AI đỉnh cao từ Google.', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60', 1),
(5, 'OnePlus 12 5G', 'OnePlus', 'Flagship killer với hiệu năng siêu khủng và sạc siêu nhanh.', 'https://images.unsplash.com/photo-1565849328260-577cf935d500?w=500&auto=format&fit=crop&q=60', 1),

-- Laptops (CategoryId = 2)
(6, 'MacBook Pro 14" M3', 'Apple', 'Laptop đồ họa sang trọng, mỏng nhẹ, pin cực trâu sử dụng chip Apple Silicon M3.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60', 2),
(7, 'Dell XPS 13 9340 Core Ultra 7', 'Dell', 'Laptop doanh nhân siêu mỏng nhẹ thời thượng với màn hình tràn viền vô cực.', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60', 2),
(8, 'ASUS ROG Zephyrus G14 OLED', 'ASUS', 'Laptop gaming đẳng cấp trang bị màn hình OLED tuyệt đẹp và hiệu năng cực mạnh.', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60', 2),
(9, 'ThinkPad X1 Carbon Gen 11', 'Lenovo', 'Huyền thoại laptop văn phòng bền bỉ, bàn phím gõ đỉnh cao siêu nhẹ.', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60', 2),
(10, 'HP Spectre x360 14" OLED', 'HP', 'Laptop xoay gập 360 độ sang trọng kết hợp màn hình OLED cảm ứng.', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=60', 2),

-- Cameras (CategoryId = 3)
(11, 'Sony Alpha A7 IV', 'Sony', 'Máy ảnh mirrorless fullframe huyền thoại dành cho vlogger và nhiếp ảnh chuyên nghiệp.', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60', 3),
(12, 'Fujifilm X-T5 Mirrorless Camera', 'Fujifilm', 'Thiết kế vintage cổ điển cùng giả lập màu phim tuyệt đẹp từ Fujifilm.', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&auto=format&fit=crop&q=60', 3),
(13, 'Canon EOS R6 Mark II', 'Canon', 'Máy ảnh fullframe lấy nét siêu nhanh và quay phim không giới hạn của Canon.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60', 3),
(14, 'GoPro Hero 12 Black', 'GoPro', 'Camera hành trình nhỏ gọn chống rung đỉnh cao dành cho dân phượt.', 'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=500&auto=format&fit=crop&q=60', 3),
(15, 'DJI Osmo Pocket 3 Creator Combo', 'DJI', 'Camera mini tích hợp gimbal 3 trục xoay gập linh hoạt bỏ túi.', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60', 3),

-- Phụ kiện
(16, 'Micro cài áo không dây Rode Wireless PRO', 'Rode', 'Bộ micro không dây ghi âm chuyên nghiệp chống nhiễu đỉnh cao.', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=60', 3),
(17, 'Đèn LED Ring Elgato Ring Light', 'Elgato', 'Đèn LED livestream chuyên nghiệp chuẩn studio điều chỉnh nhiệt độ màu.', 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=500&auto=format&fit=crop&q=60', 3),
(18, 'Màn hình LG DualUp 28" Ergonomic SDQ600', 'LG', 'Màn hình tỉ lệ 16:18 độc đáo hỗ trợ đa nhiệm làm việc văn phòng.', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60', 2),
(19, 'Bàn phím cơ công thái học Logitech Ergo K860', 'Logitech', 'Bàn phím công thái học hỗ trợ chống đau cổ tay khi gõ lâu.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60', 2),
(20, 'Chuột công thái học Logitech MX Master 3S', 'Logitech', 'Chuột văn phòng cao cấp nhất thế giới hỗ trợ cuộn siêu nhanh.', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60', 2),
(21, 'Gậy Selfie 3-Way GoPro chính hãng', 'GoPro', 'Gậy tự sướng 3 trong 1 đa năng cho camera hành trình.', 'https://images.unsplash.com/photo-1622495894254-2101b0f5b9d5?w=500&auto=format&fit=crop&q=60', 3),
(22, 'Pin dự phòng Anker Prime 20000mAh 200W', 'Anker', 'Pin dự phòng sạc siêu nhanh công suất khủng 200W.', 'https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=500&auto=format&fit=crop&q=60', 1);


-- Insert Device_Variant (Các phiên bản cấu hình chi tiết)
INSERT INTO "Device_Variant" ("VariantID", "DeviceID", "Condition", "Color", "StorageCapacity", "DailyRentalPrice", "DepositAmount", "Quantity", "DeviceStatus") VALUES
-- iPhone 15 Pro Max (DeviceID = 1)
(1, 1, 'New', 'Bạc', '256GB', 150000, 29490000, 12, 'Available'),
(2, 1, 'New', 'Bạc', '512GB', 180000, 33990000, 6, 'Available'),
(3, 1, 'New', 'Cam', '256GB', 150000, 29490000, 4, 'Available'),
(29, 1, 'New', 'Xanh', '256GB', 150000, 29490000, 5, 'Available'),

-- Samsung Galaxy S24 Ultra (DeviceID = 2)
(4, 2, 'New', 'Xám Titan', '256GB', 130000, 24990000, 5, 'Available'),
(5, 2, 'New', 'Xám Titan', '512GB', 140000, 26990000, 8, 'Available'),

-- Xiaomi 14 Ultra (DeviceID = 3)
(6, 3, 'New', 'Đen', '512GB', 110000, 22990000, 5, 'Available'),

-- Google Pixel 8 Pro (DeviceID = 4)
(7, 4, 'New', 'Xanh', '128GB', 100000, 18990000, 3, 'Available'),

-- OnePlus 12 (DeviceID = 5)
(8, 5, 'New', 'Xanh Lá', '256GB', 80000, 16490000, 15, 'Available'),

-- MacBook Pro 14" (DeviceID = 6)
(9, 6, 'New', 'Xám Không Gian', '512GB', 250000, 38990000, 7, 'Available'),
(10, 6, 'New', 'Bạc', '512GB', 250000, 38990000, 3, 'Available'),
(11, 6, 'New', 'Bạc', '1TB', 280000, 44990000, 2, 'Available'),

-- Dell XPS 13 (DeviceID = 7)
(12, 7, 'New', 'Bạc', '512GB', 220000, 35490000, 4, 'Available'),

-- ASUS ROG (DeviceID = 8)
(13, 8, 'New', 'Trắng', '1TB', 300000, 44990000, 6, 'Available'),

-- ThinkPad X1 (DeviceID = 9)
(14, 9, 'New', 'Đen', '512GB', 240000, 41990000, 9, 'Available'),

-- HP Spectre (DeviceID = 10)
(15, 10, 'New', 'Xanh Đen', '512GB', 200000, 33990000, 5, 'Available'),

-- Sony Alpha A7 IV (DeviceID = 11)
(16, 11, 'New', 'Đen', 'Chỉ Body', 350000, 54990000, 5, 'Available'),
(17, 11, 'New', 'Đen', 'Combo Kèm Lens 24-70mm', 450000, 68990000, 2, 'Available'),

-- Fujifilm X-T5 (DeviceID = 12)
(18, 12, 'New', 'Bạc', 'Chỉ Body', 280000, 43900000, 3, 'Available'),

-- Canon EOS R6 (DeviceID = 13)
(19, 13, 'New', 'Đen', 'Chỉ Body', 380000, 58900000, 2, 'Available'),

-- GoPro Hero 12 (DeviceID = 14)
(20, 14, 'New', 'Đen', 'Chỉ Body', 80000, 9990000, 18, 'Available'),

-- DJI Osmo (DeviceID = 15)
(21, 15, 'New', 'Đen', 'Creator Combo', 120000, 15890000, 10, 'Available'),

-- Phụ kiện (DeviceID 16 -> 22)
(22, 16, 'New', 'Đen', 'Không có', 60000, 10500000, 14, 'Available'),
(23, 17, 'New', 'Đen', 'Không có', 30000, 4500000, 20, 'Available'),
(24, 18, 'New', 'Đen', 'Không có', 90000, 12900000, 6, 'Available'),
(25, 19, 'New', 'Đen', 'Không có', 20000, 2990000, 12, 'Available'),
(26, 20, 'New', 'Đen', 'Không có', 15000, 2490000, 25, 'Available'),
(27, 21, 'New', 'Đen', 'Không có', 10000, 1890000, 30, 'Available'),
(28, 22, 'New', 'Đen', 'Không có', 15000, 2800000, 45, 'Available');


-- Insert Device_Image (Phân chia chi tiết theo màu Color)
INSERT INTO "Device_Image" ("DeviceID", "Color", "ImageURL", "IsPrimary") VALUES
(1, 'Bạc', 'https://tebkpmtbzythtjowdvak.supabase.co/storage/v1/object/sign/images/iphone-17-pro-max-bac-1-639174801710729848-750x500.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82OTE1YmQ1My1iZjYyLTQwZmYtODdmZS0yYjQxMjYyMWY4M2YiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvaXBob25lLTE3LXByby1tYXgtYmFjLTEtNjM5MTc0ODAxNzEwNzI5ODQ4LTc1MHg1MDAuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MjM2OTY3NiwiZXhwIjoxODEzOTA1Njc2fQ.0EtxRGlZNqcaUA5enm9wrOPnOPQ_tTUTafu_a7xAR0w', TRUE),
(1, 'Bạc', 'https://tebkpmtbzythtjowdvak.supabase.co/storage/v1/object/sign/images/iphone-17-pro-max-bac-2-639174801716875434-750x500.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82OTE1YmQ1My1iZjYyLTQwZmYtODdmZS0yYjQxMjYyMWY4M2YiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvaXBob25lLTE3LXByby1tYXgtYmFjLTItNjM5MTc0ODAxNzE2ODc1NDM0LTc1MHg1MDAuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MjM2OTQxMiwiZXhwIjoxODEzOTA1NDEyfQ.go0n5E6oPWHoIMINHspYHICBGhAehVpus63YHVWpJ8c', FALSE),
(1, 'Cam', 'https://tebkpmtbzythtjowdvak.supabase.co/storage/v1/object/sign/images/iphone-17-pro-max-cam-1-639174800885056316-750x500.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82OTE1YmQ1My1iZjYyLTQwZmYtODdmZS0yYjQxMjYyMWY4M2YiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvaXBob25lLTE3LXByby1tYXgtY2FtLTEtNjM5MTc0ODAwODg1MDU2MzE2LTc1MHg1MDAuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MjM2OTY5MywiZXhwIjoxODEzOTA1NjkzfQ.gWs1byimnOsHtvCcjipnWN3gEqOnXZCj6raO7RxLWK4', TRUE),
(1, 'Xanh', 'https://tebkpmtbzythtjowdvak.supabase.co/storage/v1/object/sign/images/iphone-17-pro-max-xanh-2-639174797986906667-750x500.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82OTE1YmQ1My1iZjYyLTQwZmYtODdmZS0yYjQxMjYyMWY4M2YiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvaXBob25lLTE3LXByby1tYXgteGFuaC0yLTYzOTE3NDc5Nzk4NjkwNjY2Ny03NTB4NTAwLmpwZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODIzNjk3MDgsImV4cCI6MTgxMzkwNTcwOH0.eBkoIhJe4oRPIvA6tv3eBleyykJq67GrmA25CR9raVQ', TRUE),
(6, NULL, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60', TRUE),
(11, NULL, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60', TRUE);

-- Insert Customer
INSERT INTO "Customer" ("CustomerID", "FullName", "PhoneNumber", "Email", "Address", "Password", "IdentityNumber") VALUES
(1, 'Nguyễn Văn Nam', '0912345678', 'nam.nguyen@example.com', 'Hà Nội', 'pbkdf2_sha256$password123', '001095001234'),
(2, 'Trần Thị Mai', '0987654321', 'mai.tran@example.com', 'TP. Hồ Chí Minh', 'pbkdf2_sha256$password123', '002095005678'),
(3, 'Lê Minh Tuấn', '0901234567', 'tuan.le@example.com', 'Đà Nẵng', 'pbkdf2_sha256$password123', '003095009012'),
(4, 'Hoàng Minh Anh', '0934567890', 'anh.hoang@example.com', 'Cần Thơ', 'pbkdf2_sha256$password123', '004095003456'),
(5, 'Phạm Hải Đăng', '0945678901', 'dang.pham@example.com', 'Hải Phòng', 'pbkdf2_sha256$password123', '005095007890'),
(6, 'Vũ Hoàng Nam', '0956789012', 'nam.vu@example.com', 'Nha Trang', 'pbkdf2_sha256$password123', '006095001235'),
(7, 'Lê Cẩm Tú', '0967890123', 'tu.le@example.com', 'Huế', 'pbkdf2_sha256$password123', '007095005679');

-- Insert Staff
INSERT INTO "Staff" ("StaffID", "FullName", "PhoneNumber", "Email", "Password", "Position") VALUES
(1, 'Nguyễn Văn Admin', '0999999999', 'admin@rentalservice.com', 'pbkdf2_sha256$adminpassword', 'Manager'),
(2, 'Trần Thị Nhân Viên', '0988888888', 'staff1@rentalservice.com', 'pbkdf2_sha256$staffpassword', 'Sales Clerk');

-- Insert RentalOrder
INSERT INTO "RentalOrder" ("RentalOrderID", "CreateDate", "RentalStartDate", "ExpectedReturnDate", "RentalOrderStatus", "CustomerID", "StaffID") VALUES
(1, '2026-06-24 10:00:00', '2026-06-25', '2026-06-27', 'Active', 1, 1),
(2, '2026-06-24 11:30:00', '2026-06-28', '2026-06-30', 'Pending', 5, 2),
(3, '2026-06-23 09:15:00', '2026-06-24', '2026-06-25', 'Completed', 6, 1);

-- Insert RentalOrderDetail
INSERT INTO "RentalOrderDetail" ("RentalOrderID", "VariantID", "RentalDays", "UnitRentalPrice", "RentalQuantity") VALUES
(1, 1, 2, 150000, 1),
(2, 9, 2, 250000, 1),
(3, 16, 1, 350000, 1);

-- Insert Invoice
INSERT INTO "Invoice" ("InvoiceID", "PaymentDate", "PaymentMethod", "PaymentStatus", "RentalOrderID") VALUES
(1, '2026-06-24 10:05:00', 'Chuyển khoản', 'Paid', 1),
(2, NULL, 'Tiền mặt', 'Unpaid', 2),
(3, '2026-06-23 09:20:00', 'Chuyển khoản', 'Paid', 3);

-- Insert ReturnRecord
INSERT INTO "ReturnRecord" ("ReturnRecordID", "ActualReturnDate", "RentalOrderID", "StaffID") VALUES
(1, '2026-06-25 17:00:00', 3, 1);

-- Insert ReturnDevice
INSERT INTO "ReturnDevice" ("ReturnRecordID", "VariantID", "PenaltyFee", "LateDays") VALUES
(1, 16, 0, 0);

-- Insert Review
INSERT INTO "Review" ("ReviewID", "CustomerID", "RentalOrderID", "VariantID", "EquipmentRating", "ServiceRating", "Comment", "ReviewDate") VALUES
(1, 1, 1, 1, 5, 5, 'Điện thoại thuê rất mới, không một vết trầy xước. Phí thuê hợp lý, thủ tục nhanh chóng.', '2026-06-24 15:00:00'),
(2, 2, NULL, 1, 5, 5, 'Dùng thử 3 ngày thấy thích quá nên quyết định mua luôn. Tiện lợi vô cùng!', '2026-06-24 15:10:00'),
(3, 3, NULL, 1, 4, 4, 'Chất lượng máy tốt, pin còn 98%. Sẽ tiếp tục thuê ở đây khi đi du lịch.', '2026-06-24 15:20:00'),
(4, 4, NULL, 9, 5, 5, 'Macbook dùng mượt mà, hỗ trợ cực tốt cho công việc đồ họa ngắn hạn của mình.', '2026-06-24 15:30:00'),
(5, 5, 2, 9, 4, 4, 'Máy nguyên bản, sạch sẽ. Giá thuê tốt nhất thị trường.', '2026-06-24 15:40:00'),
(6, 6, 3, 16, 5, 5, 'Sony A7 IV chất lượng đỉnh cao. Đi kèm cả pin sạc đầy đủ. Dịch vụ tuyệt vời.', '2026-06-24 15:50:00'),
(7, 7, NULL, 16, 5, 5, 'Phục vụ chu đáo, máy hoạt động hoàn hảo trong suốt sự kiện của tôi.', '2026-06-24 16:00:00');

-- Insert Combos
INSERT INTO "combos" ("id", "name", "description", "price", "original_price", "image_url", "stock_quantity") VALUES
(1, 'Combo Vlogger / Tiktoker chuyên nghiệp', 'Giải pháp hoàn hảo cho các nhà sáng tạo nội dung. Bộ sản phẩm kết hợp khả năng quay phim xuất sắc, âm thanh thu âm chất lượng cao và ánh sáng chuẩn studio.', 62990000, 70390000, 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=500&auto=format&fit=crop&q=60', 5),
(2, 'Combo Work From Home (WFH) công thái học', 'Tối ưu hóa không gian làm việc của bạn với bộ máy tính màn hình phụ độc đáo và chuột/bàn phím hỗ trợ sức khỏe xương khớp, giúp nâng cao năng suất cả ngày dài.', 51990000, 57370000, 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=500&auto=format&fit=crop&q=60', 4),
(3, 'Combo Du lịch & Phượt hành trình', 'Bộ thiết bị bền bỉ lưu giữ mọi khoảnh khắc đáng nhớ trên mọi cung đường. Ghi hình mượt mà, thời lượng pin thoải mái cho cả chuyến đi dài.', 12990000, 15480000, 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=500&auto=format&fit=crop&q=60', 10);

-- Insert Combo Products
INSERT INTO "combo_products" ("combo_id", "variant_id") VALUES
(1, 16), (1, 22), (1, 23),
(2, 9), (2, 24), (2, 25), (2, 26),
(3, 20), (3, 27), (3, 28);
