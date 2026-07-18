document.addEventListener('DOMContentLoaded', () => {
    // Các DOM Elements
    const authForm = document.getElementById('auth-form');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchBtn = document.getElementById('auth-switch-btn');
    const authAlert = document.getElementById('auth-alert');

    // Trạng thái hiện tại (Mặc định là login)
    let isLoginMode = true;

    // 1. Logic chuyển đổi UI giữa Đăng nhập / Đăng ký
    authSwitchBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        
        // Reset form và thông báo
        authForm.reset();
        hideAlert();

        if (isLoginMode) {
            authTitle.textContent = 'Đăng nhập';
            authSubtitle.textContent = 'Truy cập E-Tech Store để tiếp tục';
            submitBtn.textContent = 'Đăng nhập';
            authSwitchText.textContent = 'Chưa có tài khoản?';
            authSwitchBtn.textContent = 'Đăng ký ngay';
        } else {
            authTitle.textContent = 'Đăng ký tài khoản';
            authSubtitle.textContent = 'Gia nhập cộng đồng E-Tech Store';
            submitBtn.textContent = 'Đăng ký';
            authSwitchText.textContent = 'Đã có tài khoản?';
            authSwitchBtn.textContent = 'Đăng nhập';
        }
    });

    // 2. Logic xử lý Gửi API
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Ngăn trình duyệt reload trang
        
        const phone = phoneInput.value.trim();
        const password = passwordInput.value.trim();

        // Cấu hình trạng thái đang load
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';
        hideAlert();

        try {
            // Xác định URL API dựa vào chế độ
            const apiUrl = isLoginMode ? '/api/auth/customer/login' : '/api/auth/register';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Xử lý khi API trả về lỗi (400, 401, 404...)
                throw new Error(data.message || data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
            }

            // THÀNH CÔNG
            if (isLoginMode) {
                showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');
                // Lưu token vào localStorage để dùng cho các request sau
                localStorage.setItem('accessToken', data.tokens.accessToken);
                localStorage.setItem('refreshToken', data.tokens.refreshToken);
                
                // Chuyển hướng về trang chủ sau 1.5s
                setTimeout(() => window.location.href = '/', 1500);
            } else {
                showAlert('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
                // Tự động chuyển về giao diện đăng nhập sau khi đăng ký
                setTimeout(() => {
                    authSwitchBtn.click();
                }, 1500);
            }

        } catch (error) {
            showAlert(error.message, 'error');
        } finally {
            // Phục hồi nút bấm
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? 'Đăng nhập' : 'Đăng ký';
        }
    });

    // 3. Hàm tiện ích hiển thị thông báo
    function showAlert(message, type) {
        authAlert.textContent = message;
        authAlert.style.display = 'block';
        if (type === 'success') {
            authAlert.style.backgroundColor = 'rgba(52, 199, 89, 0.15)'; // --success
            authAlert.style.color = '#059669';
            authAlert.style.border = '1px solid #34c759';
        } else {
            authAlert.style.backgroundColor = 'rgba(255, 59, 48, 0.15)'; // --danger
            authAlert.style.color = '#d93025';
            authAlert.style.border = '1px solid #ff3b30';
        }
    }

    function hideAlert() {
        authAlert.style.display = 'none';
        authAlert.textContent = '';
    }
});