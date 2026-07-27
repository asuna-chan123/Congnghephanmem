document.addEventListener('DOMContentLoaded', async () => {
    const methodCards = document.querySelectorAll('.payment-method-card');
    const confirmBtn = document.getElementById('confirm-payment-btn');
    let selectedMethod = 'wallet'; 
    let orderTotal = 0;
    let selectedItemIds = [];

    const token = localStorage.getItem('accessToken');
    
    async function authFetch(url, options = {}) {
        // Lấy thông tin user từ localStorage để trích xuất ID
        const userJson = localStorage.getItem('currentUser');
        let customerId = null;
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                customerId = user.id; // Lấy ID của khách hàng
            } catch(e) {}
        }

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            // Bổ sung header x-customer-id để Backend (Cart/Order) nhận diện được khách hàng
            ...(customerId ? { 'x-customer-id': customerId } : {}), 
            ...(options.headers || {})
        };
        const res = await fetch(url, { ...options, headers });
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
                const items = cartData.cart || [];
                document.getElementById('total-items').textContent = items.length;

                selectedItemIds = items.map(item => item.id || item.cart_item_id);
                
                orderTotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
                
                document.getElementById('subtotal').textContent = formatCurrency(orderTotal);
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