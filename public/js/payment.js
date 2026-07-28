document.addEventListener('DOMContentLoaded', async () => {
    const methodCards = document.querySelectorAll('.payment-method-card');
    const confirmBtn = document.getElementById('confirm-payment-btn');
    let selectedMethod = 'wallet';
    let orderTotal = 0;
    let selectedItemIds = [];

    const token = localStorage.getItem('accessToken');

    async function authFetch(url, options = {}) {
        // 2. Di chuyển việc lấy Token và User vào BÊN TRONG hàm 
        // để đảm bảo luôn lấy dữ liệu mới nhất mỗi khi gọi API
        const token = localStorage.getItem('accessToken');
        const userJson = localStorage.getItem('currentUser');
        const sessionId = localStorage.getItem('sessionId'); // Lấy sessionId từ bước sửa lỗi trước

        let customerId = null;
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                // Lưu ý: Đảm bảo field chứa ID của bạn tên là 'id'. 
                // Nếu database của bạn dùng '_id' hoặc 'userId' thì hãy thêm vào như dưới đây:
                customerId = user.id || user._id || user.userId;
            } catch (e) {
                console.error("Lỗi khi đọc thông tin user:", e);
            }
        }

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(customerId ? { 'x-customer-id': customerId.toString() } : {}),
            ...(sessionId ? { 'x-session-id': sessionId } : {}),
            ...(options.headers || {})
        };

        const res = await fetch(url, { ...options, headers });

        // 3. Thêm logic tự động bắt lỗi 401 (Chưa đăng nhập / Hết hạn token)
        if (res.status === 401) {
            alert("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để thanh toán.");
            window.location.href = '/auth.html'; // Đổi thành tên file HTML trang đăng nhập của bạn
            throw new Error("Unauthorized");
        }

        return res.json();
    }

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    methodCards.forEach(card => {
        card.addEventListener('click', () => {
            methodCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMethod = card.getAttribute('data-method');
        });
    });

    async function loadCheckoutData() {
        try {
            if (token) {
                // 1. Tải thông tin người dùng để tự điền form
                const profileRes = await authFetch('/api/customer/profile');
                if (profileRes && profileRes.success && profileRes.data) {
                    const profile = profileRes.data;
                    document.getElementById('shipping-name').value = profile.hoTen || profile.fullName || '';
                    document.getElementById('shipping-phone').value = profile.phone || profile.phoneNumber || '';
                }

                // 2. Lấy số dư ví thực tế từ API chuẩn của module Payment
                const walletRes = await authFetch('/api/payment/info');
                if (walletRes && walletRes.success && walletRes.data) {
                    document.getElementById('current-balance').textContent = formatCurrency(walletRes.data.balance || 0);
                }
            }

            // 3. Tải giỏ hàng
            const cartData = await authFetch('/api/cart');

            if (cartData && cartData.success) {
                const allItems = cartData.cart || [];
                
                // Lấy danh sách ID sản phẩm được chọn từ giỏ hàng (nếu có)
                const storedSelectedStr = sessionStorage.getItem('checkout_selected_items');
                let targetItemIds = null;
                if (storedSelectedStr) {
                    try {
                        targetItemIds = JSON.parse(storedSelectedStr);
                    } catch (e) {}
                }

                // Nếu có danh sách chọn riêng thì lọc ra, nếu không thì lấy tất cả
                const items = targetItemIds && Array.isArray(targetItemIds) && targetItemIds.length > 0
                    ? allItems.filter(item => targetItemIds.some(id => String(id) === String(item.cart_item_id || item.uniqueId)))
                    : allItems;

                document.getElementById('total-items').textContent = items.length;

                selectedItemIds = items.map(item => item.cart_item_id || item.uniqueId);

                // Tính tổng giá trị cho riêng các món được chọn
                let subtotal = 0;
                let deposit = 0;
                items.forEach(item => {
                    const days = item.rentalDays || item.rental_days || 1;
                    const qty = item.quantity || 1;
                    const price = item.price || item.unit_rental_price || 0;
                    const dep = item.deposit || item.deposit_amount || 0;

                    subtotal += (price * days * qty);
                    deposit += (dep * qty);
                });

                // Tính tổng cộng dựa trên Tiền thuê + Tiền cọc của các món đã chọn
                orderTotal = subtotal + deposit;

                // Cập nhật giao diện
                document.getElementById('subtotal').textContent = formatCurrency(subtotal);

                const depositEl = document.getElementById('deposit-amount');
                if (depositEl) {
                    depositEl.textContent = formatCurrency(deposit);
                }

                document.getElementById('final-total').textContent = formatCurrency(orderTotal);
            }

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu thanh toán:", error);
        }
    }

    loadCheckoutData();

    confirmBtn.addEventListener('click', async () => {
        // Chỉ lấy Họ tên và Số điện thoại (Đã bỏ địa chỉ)
        const shippingName = document.getElementById('shipping-name').value.trim();
        const shippingPhone = document.getElementById('shipping-phone').value.trim();

        if (!shippingName || !shippingPhone) {
            alert("Vui lòng điền đầy đủ họ tên và số điện thoại!");
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Đang xử lý...';

        try {
            const response = await authFetch('/api/cart/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    paymentMethod: selectedMethod,
                    shippingDetails: {
                        name: shippingName,
                        phone: shippingPhone
                    },
                    totalAmount: orderTotal,
                    selectedItemIds: selectedItemIds
                })
            });

            if (response.success) {
                alert("Thanh toán thành công! Đơn hàng của bạn đang được xử lý.");
                window.location.href = '/orders.html';
            } else {
                alert(response.message || response.error || "Thanh toán thất bại, vui lòng kiểm tra lại số dư.");
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Xác nhận thanh toán';
            }

        } catch (error) {
            console.error("Lỗi thanh toán:", error);
            alert("Có lỗi xảy ra trong quá trình thanh toán.");
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Xác nhận thanh toán';
        }
    });
});