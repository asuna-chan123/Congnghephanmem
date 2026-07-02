/* ============================================================
   Custom Web Components — Apple-Inspired
   E-Tech Store
   ============================================================ */

class CustomHeader extends HTMLElement {
    constructor() { super(); }

    connectedCallback() {
        this.render();
        this.setupTheme();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = `
        <header class="main-header" role="banner">
            <div class="header-container" style="max-width: 1020px; padding: 0 22px;">

                <!-- Logo -->
                <div class="logo-area">
                    <a href="/" class="logo" style="font-weight: 500; font-size: 16px; letter-spacing: -0.01em; color: var(--text-primary); opacity: 0.9;" aria-label="E-Tech Store trang chủ">
                        E&#8209;Tech
                    </a>
                </div>

                <!-- Category and Search Area (Apple minimal style) -->
                <div class="search-area-wrapper" style="flex: 0 1 auto; max-width: 480px; flex-direction: row; align-items: center; gap: 20px;">
                    <!-- Dropdown Button -->
                    <div class="category-dropdown-btn" id="category-dropdown-btn" role="button" aria-haspopup="true" aria-expanded="false" tabindex="0" style="font-size: 12px; opacity: 0.8; border-right: none; padding-right: 0;">
                        Danh mục <i class="fa-solid fa-chevron-down" style="font-size: 8px; margin-left: 4px;" aria-hidden="true"></i>
                        <div class="category-dropdown-menu" id="category-dropdown-menu" role="menu" style="top: calc(100% + 15px); border: 1px solid var(--border); border-radius: 18px; box-shadow: 0 20px 40px rgba(0,0,0,0.06); width: 600px; padding: 30px; background: rgba(255,255,255,0.98); backdrop-filter: blur(20px);">
                            <div class="dropdown-grid">
                                <div class="dropdown-col">
                                    <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 15px; border-bottom: none;"><i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i> Điện thoại</h4>
                                    <a href="/products.html?category=dien-thoai" style="font-size: 13px; font-weight: 400; padding: 6px 0;">Tất cả điện thoại</a>
                                    <a href="/products.html?category=dien-thoai&tag=gia-re" style="font-size: 13px; font-weight: 400; padding: 6px 0;">Giá rẻ</a>
                                    <a href="/products.html?category=dien-thoai&tag=chup-anh" style="font-size: 13px; font-weight: 400; padding: 6px 0;">Chụp ảnh đẹp</a>
                                    <a href="/products.html?category=dien-thoai&tag=hieu-nang" style="font-size: 13px; font-weight: 400; padding: 6px 0;">Hiệu năng cao</a>
                                </div>
                                <div class="dropdown-col">
                                    <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 15px; border-bottom: none;"><i class="fa-solid fa-laptop" aria-hidden="true"></i> Laptop</h4>
                                    <a href="/products.html?category=laptop" style="font-size: 13px; font-weight: 400; padding: 6px 0;">Tất cả laptop</a>
                                    <a href="/products.html?category=laptop&tag=van-phong" style="font-size: 13px; font-weight: 400; padding: 6px 0;">Văn phòng</a>
                                    <a href="/products.html?category=laptop&tag=sang-trong" style="font-size: 13px; font-weight: 400; padding: 6px 0;">Sang trọng</a>
                                </div>
                                <div class="dropdown-col">
                                    <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 15px; border-bottom: none;"><i class="fa-solid fa-camera" aria-hidden="true"></i> Máy ảnh</h4>
                                    <a href="/products.html?category=may-anh" style="font-size: 13px; font-weight: 400; padding: 6px 0;">Tất cả máy ảnh</a>
                                    <a href="/products.html?category=may-anh&tag=du-lich" style="font-size: 13px; font-weight: 400; padding: 6px 0;">Du lịch</a>
                                    <a href="/products.html?category=may-anh&tag=chuyen-nghiep" style="font-size: 13px; font-weight: 400; padding: 6px 0;">Chuyên nghiệp</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Apple-like Search Box (extremely sleek and borders-free) -->
                    <form class="search-form" action="/products.html" method="GET" role="search" style="height: 32px; background: rgba(0,0,0,0.04); border-radius: 8px; align-items: center; padding: 0 10px; width: 220px; transition: width 0.3s ease;">
                        <input
                            type="search"
                            name="search"
                            id="header-search-input"
                            placeholder="Tìm kiếm..."
                            aria-label="Tìm kiếm sản phẩm"
                            autocomplete="off"
                            style="font-size: 12px; font-weight: 400; padding: 0; height: 100%; color: var(--text-primary);"
                        >
                        <button type="submit" class="search-btn" aria-label="Tìm kiếm" style="background: transparent; color: var(--text-secondary); padding: 0; font-size: 11px; width: auto; height: auto;">
                            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        </button>
                    </form>
                </div>

                <!-- Actions -->
                <nav class="header-actions" aria-label="Tài khoản và giỏ hàng" style="gap: 16px;">
                    <a href="#" class="action-link sign-in-btn" id="signin-link" style="background: transparent; color: var(--text-primary); font-size: 12px; font-weight: 400; padding: 0; opacity: 0.8; transition: opacity 0.2s;">Đăng nhập</a>
                    <button class="action-btn" id="theme-toggle" aria-label="Đổi giao diện sáng/tối" style="width: auto; height: auto; font-size: 13px; opacity: 0.8; background: none;">
                        <i class="fa-solid fa-moon" aria-hidden="true"></i>
                    </button>
                    <a href="/favorites.html" class="action-btn favorite-btn" aria-label="Yêu thích" style="width: auto; height: auto; font-size: 13px; opacity: 0.8;">
                        <i class="fa-regular fa-heart" aria-hidden="true"></i>
                    </a>
                    <a href="/cart.html" class="action-btn cart-btn-toggle" id="cart-toggle-btn" aria-label="Giỏ hàng" style="width: auto; height: auto; font-size: 13px; opacity: 0.8; position: relative;">
                        <i class="fa-solid fa-bag-shopping" aria-hidden="true"></i>
                        <span class="cart-count" style="position: absolute; top: -7px; right: -8px; background: var(--text-primary); color: var(--bg-elevated); font-size: 8px; width: 13px; height: 13px;" aria-live="polite" aria-label="0 sản phẩm trong giỏ">0</span>
                    </a>
                </nav>

            </div>
        </header>
        `;
    }

    setupTheme() {
        const saved = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        this._updateThemeIcon(saved);
    }

    _updateThemeIcon(theme) {
        const btn = this.querySelector('#theme-toggle');
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (!icon) return;
        icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        btn.setAttribute('aria-label', theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
    }

    _toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        this._updateThemeIcon(next);
    }

    setupEventListeners() {
        const dropdownBtn  = this.querySelector('#category-dropdown-btn');
        const dropdownMenu = this.querySelector('#category-dropdown-menu');
        const themeBtn     = this.querySelector('#theme-toggle');
        const header       = this.querySelector('.main-header');

        /* ---- Category dropdown ---- */
        if (dropdownBtn && dropdownMenu) {
            dropdownBtn.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.closest('a')) return;
                e.stopPropagation();
                const isOpen = dropdownMenu.classList.toggle('show');
                dropdownBtn.classList.toggle('open', isOpen);
                dropdownBtn.setAttribute('aria-expanded', String(isOpen));
            });

            dropdownBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    dropdownBtn.click();
                }
            });

            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
                dropdownBtn.classList.remove('open');
                dropdownBtn.setAttribute('aria-expanded', 'false');
            });

            /* Smooth scroll for hash links inside dropdown */
            dropdownMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('/#')) {
                        const onHome = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
                        if (onHome) {
                            e.preventDefault();
                            const id = href.split('#')[1];
                            const el = document.getElementById(id);
                            if (el) {
                                const offset = (header ? header.offsetHeight : 52) + 20;
                                window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
                            }
                        }
                    }
                    dropdownMenu.classList.remove('show');
                    dropdownBtn.classList.remove('open');
                });
            });
        }

        /* ---- Theme toggle ---- */
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this._toggleTheme());
        }

        /* ---- Scroll: glassmorphism nav ---- */
        const onScroll = () => {
            if (!header) return;
            header.classList.toggle('scrolled', window.scrollY > 40);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // run once on init
    }

    updateCartCount(count) {
        this.querySelectorAll('.cart-count').forEach(badge => {
            badge.textContent = count;
            badge.setAttribute('aria-label', `${count} sản phẩm trong giỏ`);
        });
    }
}

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
