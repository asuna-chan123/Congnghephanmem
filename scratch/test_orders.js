const OrderModel = require('../src/models/order.model');

async function testOrderFetch() {
  try {
    console.log('Testing getOrdersByCustomerId for customer ID 1...');
    const orders = await OrderModel.getOrdersByCustomerId(1);
    console.log('Fetched orders count:', orders.length);
    console.log('Orders sample:', JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
  process.exit(0);
}

testOrderFetch();
