document.addEventListener('DOMContentLoaded', () => {
    // ---- ĐIỀU KHIỂN ANIMATION LƯỚT 3 MÀN HÌNH ----
    const track = document.getElementById('auth-track');
    
    // Khai báo nút điều hướng
    const toSignupFromSignin = document.getElementById('to-signup-from-signin');
    const toSignupFromForgot = document.getElementById('to-signup-from-forgot');
    const toSigninFromSignup = document.getElementById('to-signin-from-signup');
    const toSigninFromForgot = document.getElementById('to-signin-from-forgot');
    const toForgotFromSignin = document.getElementById('to-forgot-from-signin');
    
    // Khai báo inputs
    const signinPhoneInput = document.getElementById('signin-phone');
    const forgotPhoneInput = document.getElementById('forgot-phone');
    
    const alerts = [
        document.getElementById('signup-alert'),
        document.getElementById('signin-alert'),
        document.getElementById('forgot-alert')
    ];

    function hideAlerts() { alerts.forEach(a => a.style.display = 'none'); }
    function showAlert(alertEl, message, isSuccess) {
        alertEl.textContent = message;
        alertEl.className = `auth-alert ${isSuccess ? 'success' : 'error'}`;
        alertEl.style.display = 'block';
    }

    // Index: 0 = Đăng ký, 1 = Đăng nhập, 2 = Quên MK
    function slideTo(index) {
        hideAlerts();
        track.style.transform = `translateX(-${index * 33.333}%)`;
    }

    // --- GẮN SỰ KIỆN SLIDER ---
    toSignupFromSignin.onclick = (e) => { e.preventDefault(); slideTo(0); };
    toSignupFromForgot.onclick = (e) => { e.preventDefault(); slideTo(0); };
    toSigninFromSignup.onclick = (e) => { e.preventDefault(); slideTo(1); };
    toSigninFromForgot.onclick = (e) => { e.preventDefault(); slideTo(1); };
    
    // Tự động đẩy SĐT sang màn Quên mật khẩu
    toForgotFromSignin.onclick = (e) => { 
        e.preventDefault(); 
        if (signinPhoneInput.value.trim() !== '') {
            forgotPhoneInput.value = signinPhoneInput.value.trim();
        }
        slideTo(2); 
    };

    // ---- GỌI API THEO BACKEND HIỆN TẠI ----
    
    // 1. ĐĂNG KÝ
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        // Lấy thêm giá trị fullName
        const fullName = document.getElementById('signup-fullname').value.trim(); 
        const phone = document.getElementById('signup-phone').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const btn = document.getElementById('signup-btn');
        const alertBox = alerts[0];

        btn.disabled = true; btn.textContent = 'Đang xử lý...'; hideAlerts();

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Bổ sung fullName vào chuỗi JSON gửi xuống API
                body: JSON.stringify({ fullName, phone, password })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || data.message || 'Lỗi đăng ký');

            showAlert(alertBox, 'Đăng ký thành công! Hãy đăng nhập.', true);
            setTimeout(() => {
                signinPhoneInput.value = phone;
                document.getElementById('signup-password').value = '';
                document.getElementById('signup-fullname').value = ''; // Reset form
                slideTo(1); 
            }, 1500);

        } catch (error) {
            showAlert(alertBox, error.message, false);
        } finally {
            btn.disabled = false; btn.textContent = 'Đăng ký';
        }
    });

    // 2. ĐĂNG NHẬP (Gọi API /api/auth/customer/login)
    document.getElementById('signin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = signinPhoneInput.value.trim();
        const password = document.getElementById('signin-password').value.trim();
        const btn = document.getElementById('signin-btn');
        const alertBox = alerts[1];
        
        btn.disabled = true; btn.textContent = 'Đang xử lý...'; hideAlerts();

        try {
            const response = await fetch('/api/auth/customer/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || data.error || 'Đăng nhập thất bại.');

            showAlert(alertBox, 'Đăng nhập thành công!', true);
            // Cập nhật thông tin dựa trên cơ chế JWT của bạn
            const userInfo = data.user || data.customer || { 
                id: data.id || data.userId, // Cố gắng lấy ID từ response
                phoneNumber: phone, 
                fullName: data.fullName || 'Khách hàng' 
            };
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            localStorage.setItem('accessToken', data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.tokens.refreshToken);
            
            setTimeout(() => window.location.href = 'index.html', 1000);

        } catch (error) {
            showAlert(alertBox, error.message, false);
        } finally {
            btn.disabled = false; btn.textContent = 'Đăng nhập';
        }
    });

    // 3. QUÊN MẬT KHẨU
    document.getElementById('forgot-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = forgotPhoneInput.value.trim();
        const newPassword = document.getElementById('forgot-new-password').value.trim();
        const btn = document.getElementById('forgot-btn');
        const alertBox = alerts[2];

        btn.disabled = true; btn.textContent = 'Đang xử lý...'; hideAlerts();

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, newPassword })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || data.message || 'Cập nhật thất bại.');

            showAlert(alertBox, 'Đã cập nhật mật khẩu mới! Vui lòng đăng nhập.', true);
            setTimeout(() => {
                signinPhoneInput.value = phone;
                document.getElementById('signin-password').value = '';
                document.getElementById('forgot-new-password').value = '';
                slideTo(1); // Trượt về Form đăng nhập
            }, 1500);

        } catch (error) {
            showAlert(alertBox, error.message, false);
        } finally {
            btn.disabled = false; btn.textContent = 'Lưu mật khẩu mới';
        }
    });
});