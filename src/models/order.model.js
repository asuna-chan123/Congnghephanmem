const { query, get } = require('./db');

class OrderModel {
  // 1. Cập nhật để nhận đủ tham số từ Controller
  static async createOrderFromCart(customerId, selectedItemIds, paymentMethod, shippingDetails) {
    if (!selectedItemIds || selectedItemIds.length === 0) {
      throw new Error('Không có sản phẩm nào được chọn để thanh toán.');
    }

    // 2. Sửa câu lệnh SQL: Chấp nhận cả những sản phẩm có customer_id là NULL (được thêm vào trước khi đăng nhập)
    const placeholders = selectedItemIds.map(() => '?').join(',');
    const cartSql = `
      SELECT ci.cart_item_id, ci.variant_id, ci.quantity, ci.rental_start_date, ci.rental_end_date,
             dv.daily_rental_price, (dv.daily_rental_price * 10) as deposit_amount
      FROM cart_items ci
      JOIN device_variants dv ON ci.variant_id = dv.variant_id
      WHERE ci.cart_item_id IN (${placeholders}) AND (ci.customer_id = ? OR ci.customer_id IS NULL)
    `;
    const cartItems = await query(cartSql, [...selectedItemIds, customerId]);

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Không tìm thấy sản phẩm hợp lệ trong giỏ hàng.');
    }

    // Check availability of physical device units for each variant
    for (const item of cartItems) {
      const stockRes = await get(
        `SELECT COUNT(*) as count FROM device_units WHERE variant_id = ? AND current_status = 'available'`,
        [item.variant_id]
      );
      const stock = stockRes ? stockRes.count : 0;
      if (item.quantity > stock) {
        throw new Error(`Sản phẩm không đủ hàng trong kho để đáp ứng yêu cầu thuê.`);
      }
    }

    // Calculate dates & amounts
    const orderStartDate = cartItems[0].rental_start_date || new Date().toISOString().split('T')[0];
    const orderEndDate = cartItems[0].rental_end_date || new Date(Date.now() + 86400000).toISOString().split('T')[0];

    let orderSubtotal = 0;
    let orderDeposit = 0;
    const detailsToInsert = [];

    for (const item of cartItems) {
      const diffTime = Math.abs(new Date(item.rental_end_date) - new Date(item.rental_start_date));
      const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 || 1;

      const subtotal = item.daily_rental_price * rentalDays * item.quantity;
      const deposit = item.deposit_amount * item.quantity;

      orderSubtotal += subtotal;
      orderDeposit += deposit;

      detailsToInsert.push({
        variant_id: item.variant_id,
        rental_days: rentalDays,
        rental_quantity: item.quantity,
        unit_rental_price: item.daily_rental_price,
        unit_deposit_amount: item.deposit_amount
      });
    }

    const orderTotal = orderSubtotal + orderDeposit;
    const orderCode = 'ORD-' + Date.now().toString().slice(-8);

    // 3. SỬA Ở ĐÂY: Ưu tiên lấy thông tin Họ tên, SĐT từ form thanh toán gửi lên
    const shippingName = shippingDetails?.name || '';
    const shippingPhone = shippingDetails?.phone || '';
    const shippingAddress = shippingDetails?.address || '';

    // 1. Insert into rental_orders
    const insertOrderSql = `
      INSERT INTO rental_orders (
        order_code, customer_id, rental_start_date, expected_return_date, 
        rental_order_status, subtotal_amount, deposit_amount, total_amount, payment_status,
        shipping_name, shipping_phone, shipping_address
      )
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, 'unpaid', ?, ?, ?)
      RETURNING rental_order_id
    `;
    const orderResult = await query(insertOrderSql, [
      orderCode, customerId, orderStartDate, orderEndDate, orderSubtotal, orderDeposit, orderTotal,
      shippingName, shippingPhone, shippingAddress
    ]);

    const orderId = orderResult[0].rental_order_id;

    // 2. Insert into details & bind units
    for (const detail of detailsToInsert) {
      const insertDetailSql = `
        INSERT INTO rental_order_details (
          rental_order_id, variant_id, rental_days, rental_quantity, unit_rental_price, unit_deposit_amount
        )
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING rental_order_detail_id
      `;
      const detailResult = await query(insertDetailSql, [
        orderId, detail.variant_id, detail.rental_days, detail.rental_quantity, detail.unit_rental_price, detail.unit_deposit_amount
      ]);
      const detailId = detailResult[0].rental_order_detail_id;

      // Select available physical units
      const units = await query(
        `SELECT unit_id FROM device_units WHERE variant_id = ? AND current_status = 'available' LIMIT ?`,
        [detail.variant_id, detail.rental_quantity]
      );

      for (const unit of units) {
        // Update unit status
        await query(`UPDATE device_units SET current_status = 'rented' WHERE unit_id = ?`, [unit.unit_id]);

        // Insert binding
        await query(
          `INSERT INTO rental_order_units (rental_order_detail_id, unit_id) VALUES (?, ?)`,
          [detailId, unit.unit_id]
        );
      }
    }

    // 3. Delete checkout items from cart
    await query(`DELETE FROM cart_items WHERE cart_item_id IN (${placeholders})`, selectedItemIds);

    return { orderId, orderCode };
  }

  static async getOrdersByCustomerId(customerId) {
    const sql = `
      SELECT 
        ro.rental_order_id,
        ro.order_code,
        ro.create_date,
        ro.rental_start_date,
        ro.expected_return_date,
        ro.rental_order_status,
        ro.total_amount,
        ro.payment_status,
        ro.shipping_name,
        ro.shipping_phone,
        ro.shipping_address
      FROM rental_orders ro
      WHERE ro.customer_id = ?
      ORDER BY ro.create_date DESC
    `;
    const orders = await query(sql, [customerId]);

    // For each order, fetch items
    for (const order of orders) {
      const detailsSql = `
        SELECT 
          rod.rental_order_detail_id,
          rod.variant_id,
          rod.rental_quantity,
          rod.rental_days,
          rod.unit_rental_price,
          dv.device_id,
          d.device_name,
          c.color_name as color,
          sc.capacity_value as capacity,
          d.default_image
        FROM rental_order_details rod
        JOIN device_variants dv ON rod.variant_id = dv.variant_id
        JOIN devices d ON dv.device_id = d.device_id
        LEFT JOIN colors c ON dv.color_id = c.color_id
        LEFT JOIN storage_capacities sc ON dv.capacity_id = sc.capacity_id
        WHERE rod.rental_order_id = ?
      `;
      order.items = await query(detailsSql, [order.rental_order_id]);
    }

    return orders;
  }
  //Kiểm tra sự tồn tại và cập nhật trạng thái đơn hàng thành hủy 
  static async cancelOrder(customerId, orderId) {
    //Kiểm tra sự tồn tại của đơn hàng và trạng thái đơn hàng
    const order = await get(
      `SELECT rental_order_id, rental_order_status 
      FROM rental_orders WHERE rental_order_id = ?
      AND customer_id = ?`,
      [orderId, customerId]
    );

    //Kiểm tra sự tồn tại của đơn hàng 
    if (!order) {
      throw new Error('Đơn hàng không tồn tại.');
    }
    //Kiểm tra trạng thái của đơn hàng 
    if (order.rental_order_status !== 'pending' && order.rental_order_status !== 'confirmed') {
      throw new Error('Chỉ có thể hủy đơn hàng ở trạng thái Chờ duyệt hoặc Đã duyệt.');
    }
    //Cập nhật trạng thái đơn hàng thành hủy 
    await query(`UPDATE rental_orders SET rental_order_status = 'cancelled' WHERE rental_order_id = ?`, [orderId]);
    //Giải phóng thiết bị đã được gán cho đơn hàng
    const boundUnits = await query(`
      SELECT rou.unit_id 
      FROM rental_order_units rou
      JOIN rental_order_details rod ON rou.rental_order_detail_id = rod.rental_order_detail_id
      WHERE rod.rental_order_id = ?
    `, [orderId]);

    if (boundUnits && boundUnits.length > 0) {
      const unitIds = boundUnits.map(u => u.unit_id);
      const placeholders = unitIds.map(() => '?').join(',');
      await query(`UPDATE device_units SET current_status = 'available' WHERE unit_id IN (${placeholders})`, unitIds);
    }

    return true;
  }

  // trả dữ liệu về controller
  static async updateShippingInfo(customerId, orderId, name, phone, address) {
    const order = await get(
      `SELECT rental_order_id, rental_order_status FROM rental_orders WHERE rental_order_id = ? AND customer_id = ?`,
      [orderId, customerId]
    );

    if (!order) {
      throw new Error('Đơn hàng không tồn tại.');
    }

    if (order.rental_order_status !== 'pending') {
      throw new Error('Chỉ có thể thay đổi thông tin giao hàng khi đơn ở trạng thái Chờ duyệt.');
    }
    //Đơn hàng không phải trạng thái đang thuê
    await query(
      `UPDATE rental_orders SET shipping_name = ?, shipping_phone = ?, shipping_address = ? WHERE rental_order_id = ?`,
      [name, phone, address, orderId]
    );

    return true;
  }

  static async extendOrder(customerId, orderId, newReturnDate) {
    const order = await get(
      `SELECT rental_order_id, rental_order_status, expected_return_date, subtotal_amount, total_amount 
       FROM rental_orders 
       WHERE rental_order_id = ? AND customer_id = ?`,
      [orderId, customerId]
    );

    if (!order) {
      throw new Error('Đơn hàng không tồn tại.');
    }

    if (order.rental_order_status !== 'active') {
      throw new Error('Chỉ có thể gia hạn đơn hàng đang ở trạng thái Đang thuê.');
    }

    const currentReturnDate = new Date(order.expected_return_date);
    const proposedReturnDate = new Date(newReturnDate);

    // Đặt lại thời gian về 00:00:00 để so sánh ngày
    currentReturnDate.setHours(0, 0, 0, 0);
    proposedReturnDate.setHours(0, 0, 0, 0);
    //Ngày gia hạn không hợp lệ 
    if (proposedReturnDate <= currentReturnDate) {
      throw new Error('Ngày gia hạn mới phải sau ngày trả hiện tại.');
    }

    // Calculate extra days
    const diffTime = Math.abs(proposedReturnDate - currentReturnDate);
    const extraDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (extraDays <= 0) {
      throw new Error('Số ngày gia hạn không hợp lệ.');
    }

    // Fetch order details
    const details = await query(
      `SELECT rental_order_detail_id, variant_id, rental_quantity, unit_rental_price 
       FROM rental_order_details 
       WHERE rental_order_id = ?`,
      [orderId]
    );

    let totalExtraCost = 0;

    for (const detail of details) {
      const extraCost = detail.unit_rental_price * extraDays * detail.rental_quantity;
      totalExtraCost += extraCost;

      // Cập nhật dữ liệu gia hạn
      await query(
        `UPDATE rental_order_details SET rental_days = rental_days + ? WHERE rental_order_detail_id = ?`,
        [extraDays, detail.rental_order_detail_id]
      );
    }

    // Cập nhật đơn hàng với ngày mới và số tiền mới
    await query(
      `UPDATE rental_orders 
       SET expected_return_date = ?, 
           subtotal_amount = subtotal_amount + ?, 
           total_amount = total_amount + ? 
       WHERE rental_order_id = ?`,
      [newReturnDate, totalExtraCost, totalExtraCost, orderId]
    );

    return true;
  }
  //Tính chi phí gia hạn trả về controller
  static async calculateExtendCost(customerId, orderId, newReturnDate) {
    const order = await get(
      `SELECT rental_order_id, rental_order_status, expected_return_date 
       FROM rental_orders 
       WHERE rental_order_id = ? AND customer_id = ?`,
      [orderId, customerId]
    );

    if (!order) {
      throw new Error('Đơn hàng không tồn tại.');
    }

    if (order.rental_order_status !== 'active') {
      throw new Error('Chỉ có thể tính phí gia hạn cho đơn hàng đang ở trạng thái Đang thuê.');
    }

    const currentReturnDate = new Date(order.expected_return_date);
    const proposedReturnDate = new Date(newReturnDate);

    // Reset times to midnight for date-only comparison
    currentReturnDate.setHours(0, 0, 0, 0);
    proposedReturnDate.setHours(0, 0, 0, 0);

    if (proposedReturnDate <= currentReturnDate) {
      throw new Error('Ngày gia hạn mới phải sau ngày trả hiện tại.');
    }

    // Calculate extra days
    const diffTime = Math.abs(proposedReturnDate - currentReturnDate);
    const extraDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (extraDays <= 0) {
      throw new Error('Số ngày gia hạn không hợp lệ.');
    }

    // Fetch order details
    const details = await query(
      `SELECT rod.rental_order_detail_id, rod.variant_id, rod.rental_quantity, rod.unit_rental_price, 
              d.device_name, c.color_name as color, sc.capacity_value as capacity
       FROM rental_order_details rod
       JOIN device_variants dv ON rod.variant_id = dv.variant_id
       JOIN devices d ON dv.device_id = d.device_id
       LEFT JOIN colors c ON dv.color_id = c.color_id
       LEFT JOIN storage_capacities sc ON dv.capacity_id = sc.capacity_id
       WHERE rod.rental_order_id = ?`,
      [orderId]
    );

    let totalExtraCost = 0;
    const items = [];

    for (const detail of details) {
      const extraCost = detail.unit_rental_price * extraDays * detail.rental_quantity;
      totalExtraCost += extraCost;
      items.push({
        deviceName: detail.device_name,
        color: detail.color,
        capacity: detail.capacity,
        quantity: detail.rental_quantity,
        unitPrice: detail.unit_rental_price,
        extraCost
      });
    }

    return {
      extraDays,
      totalExtraCost,
      items
    };
  }

  static async returnOrder(customerId, orderId) {
    const order = await get(
      `SELECT rental_order_id, rental_order_status FROM rental_orders WHERE rental_order_id = ? AND customer_id = ?`,
      [orderId, customerId]
    );

    if (!order) {
      throw new Error('Đơn hàng không tồn tại.');
    }

    if (order.rental_order_status !== 'active') {
      throw new Error('Chỉ có thể trả hàng khi đơn ở trạng thái Đang thuê.');
    }

    await query(`UPDATE rental_orders SET rental_order_status = 'returning' WHERE rental_order_id = ?`, [orderId]);
    return true;
  }
}

module.exports = OrderModel;
