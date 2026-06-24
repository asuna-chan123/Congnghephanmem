const express = require('express');
const path = require('path');
const homeRoutes = require('./src/routes/home.route');
const productRoutes = require('./src/routes/product.route');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', homeRoutes);
app.use('/api/products', productRoutes);

// Clean routes
app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
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
