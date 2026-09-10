const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');

// 0. Metadata (Colors, Capacities, Categories)
router.get('/meta', AdminController.getMetadata);
router.post('/colors', AdminController.createColor);
router.post('/capacities', AdminController.createCapacity);

// 1. Quản lý thiết bị (Devices CRUD)
router.get('/devices', AdminController.getDevices);
router.get('/devices/:id', AdminController.getDeviceDetails);         // Lấy chi tiết kèm variants & images
router.post('/devices', AdminController.createDevice);
router.put('/devices/:id', AdminController.updateDevice);
router.delete('/devices/:id', AdminController.softDeleteDevice);      // Xóa mềm thiết bị
router.post('/devices/:id/restore', AdminController.restoreDevice);   // Khôi phục thiết bị

// 1.1 Quản lý Phân loại (Device Variants)
router.post('/devices/:id/variants', AdminController.addVariant);
router.put('/variants/:id', AdminController.updateVariant);
router.delete('/variants/:id', AdminController.softDeleteVariant);    // Xóa mềm phân loại
router.post('/variants/:id/restore', AdminController.restoreVariant); // Khôi phục phân loại

// 1.2 Quản lý Hình ảnh theo màu sắc (Device Images)
router.post('/devices/:id/images', AdminController.addDeviceImage);
router.post('/images/:id/primary', AdminController.setImagePrimary);  // Đặt làm ảnh đại diện chính
router.delete('/images/:id', AdminController.deleteDeviceImage);

// 2. Quản lý danh mục (Categories CRUD)
router.get('/categories', AdminController.getCategories);
router.post('/categories', AdminController.createCategory);
router.put('/categories/:id', AdminController.updateCategory);
router.delete('/categories/:id', AdminController.softDeleteCategory);     // Xóa mềm danh mục
router.post('/categories/:id/restore', AdminController.restoreCategory);  // Khôi phục danh mục

// 3. Quản lý đơn thuê (Orders CRUD)
router.get('/orders', AdminController.getAllOrders);
router.put('/orders/:id/status', AdminController.updateOrderStatus);

// 4. Quản lý khách hàng (Customers CRUD)
router.get('/customers', AdminController.getCustomers);
router.put('/customers/:id', AdminController.updateCustomer);
router.delete('/customers/:id', AdminController.softDeleteCustomer);
router.post('/customers/:id/restore', AdminController.restoreCustomer);

// 5. Quản lý giao dịch (Payments)
router.get('/payments', AdminController.getPayments);
router.post('/payments/:id/process', AdminController.processPayment);

module.exports = router;
