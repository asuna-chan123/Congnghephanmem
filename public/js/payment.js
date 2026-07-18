document.addEventListener('DOMContentLoaded', async () => {
    // 1. Khởi tạo các DOM Element
    const methodCards = document.querySelectorAll('.payment-method-card');
    const confirmBtn = document.getElementById('confirm-payment-btn');
    let selectedMethod = 'wallet'; // Mặc định dùng Ví
    let orderTotal = 0;

    // Lấy token để gọi API bảo mật
    const token = localStorage.getItem('accessToken');
    
    // Hàm fetch kèm Token
    async function authFetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };
        const res = await fetch(url, { ...options, headers });
        return res.json();
    }

    // Tiện ích format tiền
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    // 2. Logic chọn phương thức thanh toán UI
    methodCards.forEach(card => {
        card.addEventListener('click', () => {
            methodCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMethod = card.getAttribute('data-method');
        });
    });

    // 3. Tải thông tin người dùng và Giỏ hàng
    async function loadCheckoutData() {
        try {
            // A. Tải thông tin profile để tự điền form (nếu đã đăng nhập)
            if (token) {
                const profile = await authFetch('/api/customer/profile');
                if (profile && profile.id) {
                    document.getElementById('shipping-name').value = profile.hoTen || '';
                    document.getElementById('shipping-phone').value = profile.phone || '';
                    document.getElementById('shipping-address').value = profile.diaChi || '';
                }

                // Lấy số dư ví để hiển thị
                const wallet = await authFetch('/api/customer/wallet');
                if (wallet && wallet.balance !== undefined) {
                    document.getElementById('current-balance').textContent = formatCurrency(wallet.balance);
                }
            }

            // B. Tải giỏ hàng để tính tiền (Giả định bạn có API /api/cart)
            // Thay thế bằng API thực tế của bạn
            const cartData = await authFetch('/api/cart'); 
            
            if (cartData && cartData.success) {
                const items = cartData.cart || [];
                document.getElementById('total-items').textContent = items.length;
                
                // Tính tổng tiền (Giả lập logic cộng dồn giá)
                orderTotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
                
                document.getElementById('subtotal').textContent = formatCurrency(orderTotal);
                document.getElementById('final-total').textContent = formatCurrency(orderTotal);
            }

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu thanh toán:", error);
        }
    }

    loadCheckoutData();

    // 4. Xử lý sự kiện Bấm Thanh Toán
    confirmBtn.addEventListener('click', async () => {
        // Lấy dữ liệu form
        const shippingName = document.getElementById('shipping-name').value.trim();
        const shippingPhone = document.getElementById('shipping-phone').value.trim();
        const shippingAddress = document.getElementById('shipping-address').value.trim();

        if (!shippingName || !shippingPhone || !shippingAddress) {
            alert("Vui lòng điền đầy đủ thông tin giao hàng!");
            return;
        }

        // Cập nhật UI nút bấm
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Đang xử lý...';

        try {
            // Gọi API Module Payment để xử lý thanh toán
            const response = await authFetch('/api/payment/process', {
                method: 'POST',
                body: JSON.stringify({
                    paymentMethod: selectedMethod,
                    shippingDetails: {
                        name: shippingName,
                        phone: shippingPhone,
                        address: shippingAddress
                    },
                    totalAmount: orderTotal
                })
            });

            if (response.success) {
                alert("Thanh toán thành công! Đơn hàng của bạn đang được xử lý.");
                window.location.href = '/orders.html'; // Chuyển về trang Lịch sử đơn hàng
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