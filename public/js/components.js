/* ============================================================
/* ============================================================
   Custom Footer
   ============================================================ */
class CustomFooter extends HTMLElement {
    constructor() { super(); }

    connectedCallback() { this.render(); }

    render() {
        this.innerHTML = `
        <footer class="main-footer" role="contentinfo" style="background: var(--bg-secondary); border-top: 1px solid var(--border); padding: 60px 0 30px 0;">
            <div class="footer-container" style="max-width: 1020px; margin: 0 auto; padding: 0 22px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px;">

                <!-- Brand -->
                <div class="footer-brand">
                    <a href="/" class="logo" style="font-weight: 500; font-size: 16px; letter-spacing: -0.01em; color: var(--text-primary); opacity: 0.9;" aria-label="E-Tech Store">E&#8209;Tech</a>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.8; margin-top: 15px; max-width: 320px; font-weight: 400;">Nâng tầm trải nghiệm công nghệ của bạn. Dùng thử sản phẩm Apple, thiết bị cao cấp trước khi mua.</p>
                </div>

                <!-- Links -->
                <nav class="footer-links" aria-label="Về E-Tech">
                    <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 15px; border-bottom: none; font-weight: 500;">Khám phá</h4>
                    <ul style="display: flex; flex-direction: column; gap: 10px;">
                        <li><a href="#" style="font-size: 13px; color: var(--text-secondary); font-weight: 400;">Giới thiệu</a></li>
                        <li><a href="#" style="font-size: 13px; color: var(--text-secondary); font-weight: 400;">Dùng thử</a></li>
                        <li><a href="#" style="font-size: 13px; color: var(--text-secondary); font-weight: 400;">Bảo mật</a></li>
                    </ul>
                </nav>

                <nav class="footer-links" aria-label="Hỗ trợ khách hàng">
                    <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 15px; border-bottom: none; font-weight: 500;">Hỗ trợ</h4>
                    <ul style="display: flex; flex-direction: column; gap: 10px;">
                        <li><a href="#" style="font-size: 13px; color: var(--text-secondary); font-weight: 400;">Trợ giúp</a></li>
                        <li><a href="#" style="font-size: 13px; color: var(--text-secondary); font-weight: 400;">Đổi trả</a></li>
                        <li><a href="#" style="font-size: 13px; color: var(--text-secondary); font-weight: 400;">Liên hệ</a></li>
                    </ul>
                </nav>

            </div>

            <div class="footer-bottom" style="max-width: 1020px; margin: 40px auto 0 auto; padding: 20px 22px 0 22px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); font-weight: 400;">
                <p>&copy; 2026 E-Tech. Thiết kế tối giản tinh tế.</p>
                <div style="display:flex; gap:16px;">
                    <a href="#" style="color: var(--text-secondary);">Bảo mật</a>
                    <a href="#" style="color: var(--text-secondary);">Điều khoản</a>
                </div>
            </div>
        </footer>
        `;
    }
}

customElements.define('custom-header', CustomHeader);
customElements.define('custom-footer', CustomFooter);

// Simple Apple-Style Auth Modals DOM structure and handlers
function initAuthModals() {
    if (document.getElementById('auth-modal-overlay')) return;

    const overlayHtml = `
    <div id="auth-modal-overlay" class="auth-modal-overlay">
        <!-- Sign In Modal -->
        <div id="signin-modal" class="auth-modal" style="display: none;">
            <button class="auth-modal-close" id="close-signin">&times;</button>
            <div class="auth-modal-header">
                <h3 class="auth-modal-title">Đăng nhập</h3>
                <p class="auth-modal-subtitle">Chào mừng bạn quay lại với E-Tech</p>
            </div>
            <form id="signin-form" class="auth-form">
                <div class="auth-field-group">
                    <label for="signin-email">Email</label>
                    <input type="email" id="signin-email" class="auth-input" required placeholder="nhap@email.com">
                </div>
                <div class="auth-field-group">
                    <label for="signin-password">Mật khẩu</label>
                    <input type="password" id="signin-password" class="auth-input" required placeholder="••••••••">
                </div>
                <button type="submit" class="auth-submit-btn">Đăng nhập</button>
            </form>
            <div class="auth-modal-footer">
                Chưa có tài khoản? <button id="switch-to-signup">Đăng ký ngay</button>
            </div>
        </div>

        <!-- Sign Up Modal -->
        <div id="signup-modal" class="auth-modal" style="display: none;">
            <button class="auth-modal-close" id="close-signup">&times;</button>
            <div class="auth-modal-header">
                <h3 class="auth-modal-title">Đăng ký</h3>
                <p class="auth-modal-subtitle">Tạo tài khoản để trải nghiệm dịch vụ</p>
            </div>
            <form id="signup-form" class="auth-form">
                <div class="auth-field-group">
                    <label for="signup-fullname">Họ và tên</label>
                    <input type="text" id="signup-fullname" class="auth-input" required placeholder="Nguyễn Văn A">
                </div>
                <div class="auth-field-group">
                    <label for="signup-email">Email</label>
                    <input type="email" id="signup-email" class="auth-input" required placeholder="nhap@email.com">
                </div>
                <div class="auth-field-group">
                    <label for="signup-phone">Số điện thoại</label>
                    <input type="tel" id="signup-phone" class="auth-input" placeholder="0912345678">
                </div>
                <div class="auth-field-group">
                    <label for="signup-address">Địa chỉ</label>
                    <input type="text" id="signup-address" class="auth-input" placeholder="Hà Nội, Việt Nam">
                </div>
                <div class="auth-field-group">
                    <label for="signup-password">Mật khẩu</label>
                    <input type="password" id="signup-password" class="auth-input" required placeholder="••••••••">
                </div>
                <button type="submit" class="auth-submit-btn">Đăng ký</button>
            </form>
            <div class="auth-modal-footer">
                Đã có tài khoản? <button id="switch-to-signin">Đăng nhập</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlayHtml);

    const overlay = document.getElementById('auth-modal-overlay');
    const signinM = document.getElementById('signin-modal');
    const signupM = document.getElementById('signup-modal');

    window.openSignInModal = function () {
        overlay.classList.add('active');
        signinM.style.display = 'block';
        signupM.style.display = 'none';
    };

    window.openSignUpModal = function () {
        overlay.classList.add('active');
        signinM.style.display = 'none';
        signupM.style.display = 'block';
    };

    window.closeAuthModal = function () {
        overlay.classList.remove('active');
        setTimeout(() => {
            signinM.style.display = 'none';
            signupM.style.display = 'none';
        }, 400);
    };

    document.getElementById('close-signin').onclick = window.closeAuthModal;
    document.getElementById('close-signup').onclick = window.closeAuthModal;
    document.getElementById('switch-to-signup').onclick = window.openSignUpModal;
    document.getElementById('switch-to-signin').onclick = window.openSignInModal;

    overlay.onclick = function (e) {
        if (e.target === overlay) window.closeAuthModal();
    };

    document.getElementById('signin-form').onsubmit = async function (e) {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        const sessionId = localStorage.getItem('sessionId');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': sessionId
                },
                body: JSON.stringify({ email, password })
            }).then(r => r.json());

            if (res.success) {
                localStorage.setItem('currentUser', JSON.stringify(res.user));
                window.closeAuthModal();
                if (typeof window.showStatusPopup === 'function') {
                    window.showStatusPopup(true, 'Đăng nhập thành công!');
                }
                setTimeout(() => window.location.reload(), 1000);
            } else {
                if (typeof window.showStatusPopup === 'function') {
                    window.showStatusPopup(false, res.message || 'Đăng nhập thất bại.');
                }
            }
        } catch (err) {
            console.error(err);
            if (typeof window.showStatusPopup === 'function') {
                window.showStatusPopup(false, 'Lỗi kết nối máy chủ.');
            }
        }
    };

    document.getElementById('signup-form').onsubmit = async function (e) {
        e.preventDefault();
        const fullName = document.getElementById('signup-fullname').value;
        const email = document.getElementById('signup-email').value;
        const phoneNumber = document.getElementById('signup-phone').value;
        const address = document.getElementById('signup-address').value;
        const password = document.getElementById('signup-password').value;
        const sessionId = localStorage.getItem('sessionId');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': sessionId
                },
                body: JSON.stringify({ fullName, email, phoneNumber, address, password })
            }).then(r => r.json());

            if (res.success) {
                localStorage.setItem('currentUser', JSON.stringify(res.user));
                window.closeAuthModal();
                if (typeof window.showStatusPopup === 'function') {
                    window.showStatusPopup(true, 'Đăng ký thành công!');
                }
                setTimeout(() => window.location.reload(), 1000);
            } else {
                if (typeof window.showStatusPopup === 'function') {
                    window.showStatusPopup(false, res.message || 'Đăng ký thất bại.');
                }
            }
        } catch (err) {
            console.error(err);
            if (typeof window.showStatusPopup === 'function') {
                window.showStatusPopup(false, 'Lỗi kết nối máy chủ.');
            }
        }
    };
}