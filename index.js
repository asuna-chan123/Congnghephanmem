const express = require('express');
const path = require('path');
const homeRoutes = require('./src/routes/home.route');
const productRoutes = require('./src/routes/product.route');
const cartRoutes = require('./src/routes/cart.route');
const favoriteRoutes = require('./src/routes/favorite.route');
const orderRoutes = require('./src/routes/order.route');
const reviewRoutes = require('./src/routes/review.route');

// Nạp các Module
const authModule = require('./src/Auth/routes'); 
const customerModule = require('./src/Customer/routes');
const paymentModule = require('./src/Payment/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', homeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', reviewRoutes);

// Gắn các Module
app.use('/api/auth', authModule);
app.use('/api/customer', customerModule);
app.use('/api/payment', paymentModule);

// Clean routes
app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});
app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

// API Bắt mạch kết nối
const { get } = require('./src/models/db');
app.get('/api/ping', async (req, res) => {
    try {
        // Truy vấn thời gian hiện tại từ PostgreSQL
        const dbTime = await get('SELECT NOW()'); 
        res.json({ 
            status: 'THÀNH CÔNG', 
            message: 'Frontend, Server và Database đang kết nối hoàn hảo!', 
            thoi_gian_database: dbTime 
        });
    } catch (err) {
        res.status(500).json({ status: 'THẤT BẠI', error: err.message });
    }
});

// Catch-all to serve index.html for undefined routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  Server is running on http://localhost:${PORT}`);
  console.log(`=================================================`);
});
