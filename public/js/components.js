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
        const currentUserJson = localStorage.getItem('currentUser');
        let userSectionHtml = '';
        if (currentUserJson) {
            try {
                // Đã đăng nhập: Hiện Icon Người dùng và Icon Đăng xuất
                userSectionHtml = `
                    <a href="customer.html" class="action-btn" aria-label="Tài khoản" style="width: auto; height: auto; font-size: 14px; opacity: 0.8; margin-right: 4px;">
                        <i class="fa-solid fa-user"></i>
                    </a>
                    <a href="#" class="action-btn" id="signout-link" aria-label="Đăng xuất" style="width: auto; height: auto; font-size: 14px; opacity: 0.8; color: var(--danger);">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    </a>
                `;
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        }
        if (!userSectionHtml) {
            // Chưa đăng nhập: Hiện Icon Người dùng trỏ sang trang auth.html
            userSectionHtml = `
                <a href="auth.html" class="action-btn" aria-label="Đăng nhập" style="width: auto; height: auto; font-size: 14px; opacity: 0.8;">
                    <i class="fa-regular fa-user"></i>
                </a>
            `;
        }

        this.innerHTML = `
        <header class="main-header" role="banner">
            <div class="header-container" style="max-width: 1020px; padding: 0 22px;">

                <!-- Logo -->
                <div class="logo-area">
                    <a href="index.html" class="logo" style="font-weight: 500; font-size: 16px; letter-spacing: -0.01em; color: var(--text-primary); opacity: 0.9;" aria-label="E-Tech Store trang chủ">
                        E&#8209;Tech
                    </a>
                </div>

                <!-- Category and Search Area (Apple minimal style) -->
                <div class="search-area-wrapper" style="flex: 0 1 auto; max-width: 480px; flex-direction: row; align-items: center; gap: 20px;">
                    <!-- Staggered Menu Toggle Button -->
                    <button
                      id="sm-toggle-btn"
                      class="sm-toggle"
                      aria-label="Open menu"
                      aria-expanded="false"
                      aria-controls="staggered-menu-panel"
                      type="button"
                    >
                      <span class="sm-toggle-textWrap" aria-hidden="true">
                        <span id="sm-toggle-text-inner" class="sm-toggle-textInner">
                          <span class="sm-toggle-line">Danh mục</span>
                        </span>
                      </span>
                      <span id="sm-toggle-icon" class="sm-icon" aria-hidden="true">
                        <span id="sm-plus-h" class="sm-icon-line"></span>
                        <span id="sm-plus-v" class="sm-icon-line sm-icon-line-v"></span>
                      </span>
                    </button>

                    <!-- Search Box (extremely sleek and borders-free) -->
                    <form class="search-form" action="products.html" method="GET" role="search" style="height: 32px; background: rgba(0,0,0,0.04); border-radius: 8px; align-items: center; padding: 0 10px; width: 220px; transition: width 0.3s ease;">
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
                <nav class="header-actions" aria-label="Tài khoản và giỏ hàng" style="gap: 12px; align-items: center;">
                    ${userSectionHtml}
                    <button class="action-btn" id="theme-toggle" aria-label="Đổi giao diện sáng/tối" style="width: auto; height: auto; font-size: 13px; opacity: 0.8; background: none;">
                        <i class="fa-solid fa-moon" aria-hidden="true"></i>
                    </button>
                    <a href="favorites.html" class="action-btn favorite-btn" aria-label="Yêu thích" style="width: auto; height: auto; font-size: 13px; opacity: 0.8;">
                        <i class="fa-regular fa-heart" aria-hidden="true"></i>
                    </a>
                    <a href="cart.html" class="action-btn cart-btn-toggle" id="cart-toggle-btn" aria-label="Giỏ hàng" style="width: auto; height: auto; font-size: 13px; opacity: 0.8; position: relative;">
                        <i class="fa-solid fa-bag-shopping" aria-hidden="true"></i>
                        <span class="cart-count" style="position: absolute; top: -7px; right: -8px; background: var(--text-primary); color: var(--bg-elevated); font-size: 8px; width: 13px; height: 13px;" aria-live="polite" aria-label="0 sản phẩm trong giỏ">0</span>
                    </a>
                    ${currentUserJson ? `
                    <a href="orders.html" class="action-btn orders-btn" aria-label="Đơn hàng" style="width: auto; height: auto; font-size: 13px; opacity: 0.8;">
                        <i class="fa-solid fa-truck" aria-hidden="true"></i>
                    </a>
                    ` : ''}
                </nav>

            </div>
        </header>

        <!-- Staggered Menu Overlay DOM -->
        <div id="staggered-menu-wrapper" class="staggered-menu-wrapper" data-position="right">
          <div id="sm-prelayers" class="sm-prelayers" aria-hidden="true"></div>
          <aside id="staggered-menu-panel" class="staggered-menu-panel" aria-hidden="true">
            <div class="sm-panel-inner">
              <ul class="sm-panel-list" role="list" data-numbering="true">
                <li class="sm-panel-itemWrap">
                  <a class="sm-panel-item" href="index.html" aria-label="Trang chủ">
                    <span class="sm-panel-itemLabel">Trang chủ</span>
                  </a>
                </li>
                <li class="sm-panel-itemWrap">
                  <a class="sm-panel-item" href="products.html?category=dien-thoai" aria-label="Điện thoại">
                    <span class="sm-panel-itemLabel">Điện thoại</span>
                  </a>
                </li>
                <li class="sm-panel-itemWrap">
                  <a class="sm-panel-item" href="products.html?category=laptop" aria-label="Laptop">
                    <span class="sm-panel-itemLabel">Laptop</span>
                  </a>
                </li>
                <li class="sm-panel-itemWrap">
                  <a class="sm-panel-item" href="products.html?category=may-anh" aria-label="Máy ảnh">
                    <span class="sm-panel-itemLabel">Máy ảnh</span>
                  </a>
                </li>
                <li class="sm-panel-itemWrap">
                  <a class="sm-panel-item" href="cart.html" aria-label="Giỏ hàng">
                    <span class="sm-panel-itemLabel">Giỏ hàng</span>
                  </a>
                </li>
              </ul>
              <div class="sm-socials" aria-label="Mạng xã hội">
                <h3 class="sm-socials-title">Mạng xã hội</h3>
                <ul class="sm-socials-list" role="list">
                  <li class="sm-socials-item">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="sm-socials-link">Twitter</a>
                  </li>
                  <li class="sm-socials-item">
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="sm-socials-link">GitHub</a>
                  </li>
                  <li class="sm-socials-item">
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="sm-socials-link">LinkedIn</a>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
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

    setupStaggeredLayers() {
        this.menuOpen = false;
        this.menuPosition = 'right';
        this.busy = false;
        this.colors = ['#B497CF', '#5227FF'];

        const preContainer = this.querySelector('#sm-prelayers');
        if (preContainer) {
            preContainer.innerHTML = this.colors.map((c, i) => `<div class="sm-prelayer" style="background: ${c}"></div>`).join('');
        }

        if (typeof gsap !== 'undefined') {
            const panel = this.querySelector('#staggered-menu-panel');
            const preLayers = Array.from(this.querySelectorAll('.sm-prelayer'));
            const plusH = this.querySelector('#sm-plus-h');
            const plusV = this.querySelector('#sm-plus-v');
            const icon = this.querySelector('#sm-toggle-icon');
            const textInner = this.querySelector('#sm-toggle-text-inner');

            if (panel) {
                const offscreen = this.menuPosition === 'left' ? -100 : 100;
                gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
                gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
                gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
                gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
                gsap.set(textInner, { yPercent: 0 });
            }
        }
    }

    animateIcon(opening) {
        const icon = this.querySelector('#sm-toggle-icon');
        if (!icon || typeof gsap === 'undefined') return;
        if (this.spinTween) this.spinTween.kill();
        if (opening) {
            this.spinTween = gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
        } else {
            this.spinTween = gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
        }
    }

    animateText(opening) {
        const inner = this.querySelector('#sm-toggle-text-inner');
        if (!inner || typeof gsap === 'undefined') return;
        if (this.textCycleAnim) this.textCycleAnim.kill();

        const currentLabel = opening ? 'Danh mục' : 'Đóng';
        const targetLabel = opening ? 'Đóng' : 'Danh mục';
        const cycles = 3;
        const seq = [currentLabel];
        let last = currentLabel;
        for (let i = 0; i < cycles; i++) {
            last = last === 'Danh mục' ? 'Đóng' : 'Danh mục';
            seq.push(last);
        }
        if (last !== targetLabel) seq.push(targetLabel);
        seq.push(targetLabel);

        inner.innerHTML = seq.map(l => `<span class="sm-toggle-line">${l}</span>`).join('');

        gsap.set(inner, { yPercent: 0 });
        const lineCount = seq.length;
        const finalShift = ((lineCount - 1) / lineCount) * 100;
        this.textCycleAnim = gsap.to(inner, {
            yPercent: -finalShift,
            duration: 0.5 + lineCount * 0.07,
            ease: 'power4.out'
        });
    }

    playOpen() {
        if (this.busy || typeof gsap === 'undefined') return;
        this.busy = true;

        const wrapper = this.querySelector('#staggered-menu-wrapper');
        if (wrapper) {
            wrapper.classList.add('fixed-wrapper');
            wrapper.setAttribute('data-open', 'true');
        }

        const panel = this.querySelector('#staggered-menu-panel');
        const layers = Array.from(this.querySelectorAll('.sm-prelayer'));
        if (!panel) {
            this.busy = false;
            return;
        }

        if (this.openTl) this.openTl.kill();
        if (this.closeTween) {
            this.closeTween.kill();
            this.closeTween = null;
        }

        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
        const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
        const socialTitle = panel.querySelector('.sm-socials-title');
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

        const offscreen = this.menuPosition === 'left' ? -100 : 100;
        const layerStates = layers.map(el => ({ el, start: offscreen }));
        const panelStart = offscreen;

        if (itemEls.length) {
            gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        }
        if (numberEls.length) {
            gsap.set(numberEls, { '--sm-num-opacity': 0 });
        }
        if (socialTitle) {
            gsap.set(socialTitle, { opacity: 0 });
        }
        if (socialLinks.length) {
            gsap.set(socialLinks, { y: 25, opacity: 0 });
        }

        const tl = gsap.timeline();

        layerStates.forEach((ls, i) => {
            tl.fromTo(ls.el, { xPercent: ls.start, opacity: 1 }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
        });
        const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
        const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
        const panelDuration = 0.65;
        tl.fromTo(
            panel,
            { xPercent: panelStart, opacity: 1 },
            { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
            panelInsertTime
        );

        if (itemEls.length) {
            const itemsStartRatio = 0.15;
            const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
            tl.to(
                itemEls,
                {
                    yPercent: 0,
                    rotate: 0,
                    duration: 1,
                    ease: 'power4.out',
                    stagger: { each: 0.1, from: 'start' }
                },
                itemsStart
            );
            if (numberEls.length) {
                tl.to(
                    numberEls,
                    {
                        duration: 0.6,
                        ease: 'power2.out',
                        '--sm-num-opacity': 1,
                        stagger: { each: 0.08, from: 'start' }
                    },
                    itemsStart + 0.1
                );
            }
        }

        if (socialTitle || socialLinks.length) {
            const socialsStart = panelInsertTime + panelDuration * 0.4;
            if (socialTitle) {
                tl.to(
                    socialTitle,
                    {
                        opacity: 1,
                        duration: 0.5,
                        ease: 'power2.out'
                    },
                    socialsStart
                );
            }
            if (socialLinks.length) {
                tl.to(
                    socialLinks,
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.55,
                        ease: 'power3.out',
                        stagger: { each: 0.08, from: 'start' },
                        onComplete: () => {
                            gsap.set(socialLinks, { clearProps: 'opacity' });
                        }
                    },
                    socialsStart + 0.04
                );
            }
        }

        tl.eventCallback('onComplete', () => {
            this.busy = false;
        });

        this.openTl = tl;
    }

    playClose() {
        if (typeof gsap === 'undefined') return;

        if (this.openTl) {
            this.openTl.kill();
            this.openTl = null;
        }

        const panel = this.querySelector('#staggered-menu-panel');
        const layers = Array.from(this.querySelectorAll('.sm-prelayer'));
        if (!panel) return;

        const all = [...layers, panel];
        if (this.closeTween) this.closeTween.kill();
        const offscreen = this.menuPosition === 'left' ? -100 : 100;

        this.closeTween = gsap.to(all, {
            xPercent: offscreen,
            duration: 0.32,
            ease: 'power3.in',
            overwrite: 'auto',
            onComplete: () => {
                const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
                if (itemEls.length) {
                    gsap.set(itemEls, { yPercent: 140, rotate: 10 });
                }
                const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
                if (numberEls.length) {
                    gsap.set(numberEls, { '--sm-num-opacity': 0 });
                }
                const socialTitle = panel.querySelector('.sm-socials-title');
                const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));
                if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
                if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
                this.busy = false;

                const wrapper = this.querySelector('#staggered-menu-wrapper');
                if (wrapper) {
                    wrapper.classList.remove('fixed-wrapper');
                    wrapper.removeAttribute('data-open');
                }
            }
        });
    }

    toggleMenu() {
        const target = !this.menuOpen;
        this.menuOpen = target;
        const toggleBtn = this.querySelector('#sm-toggle-btn');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', String(target));
        }

        if (target) {
            this.playOpen();
        } else {
            this.playClose();
        }

        this.animateIcon(target);
        this.animateText(target);
    }

    closeMenu() {
        if (this.menuOpen) {
            this.menuOpen = false;
            const toggleBtn = this.querySelector('#sm-toggle-btn');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
            this.playClose();
            this.animateIcon(false);
            this.animateText(false);
        }
    }

    setupEventListeners() {
        const toggleBtn = this.querySelector('#sm-toggle-btn');
        const themeBtn = this.querySelector('#theme-toggle');
        const header = this.querySelector('.main-header');
        const panel = this.querySelector('#staggered-menu-panel');
        const signoutLink = this.querySelector('#signout-link');

        this.setupStaggeredLayers();

        if (typeof initAuthModals === 'function') {
            initAuthModals();
        }

        // LOGIC ĐĂNG XUẤT NHANH (QUICK LOGOUT)
        if (signoutLink) {
            signoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Chỉ xóa accessToken, giữ nguyên refreshToken và currentUser
                localStorage.removeItem('accessToken');
                
                if (typeof window.showStatusPopup === 'function') {
                    window.showStatusPopup(true, 'Đã khóa phiên làm việc hiện tại.');
                } else {
                    alert('Đã khóa phiên làm việc hiện tại.');
                }
                
                setTimeout(() => window.location.href = 'index.html', 1000);
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });

            toggleBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleBtn.click();
                }
            });
        }

        // Close on click outside
        document.addEventListener('mousedown', (event) => {
            if (!this.menuOpen) return;
            if (panel && !panel.contains(event.target) && toggleBtn && !toggleBtn.contains(event.target)) {
                this.closeMenu();
            }
        });

        // Handle navigation inside menu
        if (panel) {
            panel.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    this.closeMenu();
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
                    <a href="index.html" class="logo" style="font-weight: 500; font-size: 16px; letter-spacing: -0.01em; color: var(--text-primary); opacity: 0.9;" aria-label="E-Tech Store">E&#8209;Tech</a>
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

    const closeSignin = document.getElementById('close-signin');
    const closeSignup = document.getElementById('close-signup');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToSignin = document.getElementById('switch-to-signin');

    if (closeSignin) closeSignin.onclick = window.closeAuthModal;
    if (closeSignup) closeSignup.onclick = window.closeAuthModal;
    if (switchToSignup) switchToSignup.onclick = window.openSignUpModal;
    if (switchToSignin) switchToSignin.onclick = window.openSignInModal;

    if (overlay) {
        overlay.onclick = function (e) {
            if (e.target === overlay) window.closeAuthModal();
        };
    }

    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.onsubmit = async function (e) {
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
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.onsubmit = async function (e) {
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

/* ============================================================
   GLOBAL JWT GUARDIAN & RE-AUTH MODAL (CỤM 2) - BẢN BLUR BACKGROUND
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    initReauthModal();
});

function initReauthModal() {
    if (document.getElementById('reauth-modal-overlay')) return;

    const overlayHtml = `
    <div id="reauth-modal-overlay" class="auth-modal-overlay" style="display: none; align-items: center; justify-content: center; z-index: 9999; background: rgba(0,0,0,0.4); position: fixed; inset: 0; backdrop-filter: blur(2px);">
        <div class="auth-modal auth-modal-static" style="width: 100%; max-width: 380px; background: var(--card-bg); padding: 32px 24px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); position: relative; text-align: center;">
            <button id="close-reauth" style="position: absolute; top: 16px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); transition: color 0.2s;">&times;</button>
            
            <div style="width: 64px; height: 64px; background: var(--bg-secondary); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--text-secondary);">
                <i class="fa-solid fa-lock"></i>
            </div>
            
            <h3 id="reauth-title" style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Chào Khách</h3>
            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 24px;">Vui lòng nhập mật khẩu để tiếp tục.</p>
            
            <form id="reauth-form" style="text-align: left;">
                <div class="auth-field-group">
                    <input type="password" id="reauth-password" class="auth-input" required placeholder="Nhập mật khẩu của bạn" style="text-align: center; font-size: 16px; letter-spacing: 2px;">
                </div>
                <div id="reauth-error" style="color: var(--danger); font-size: 13px; margin-bottom: 16px; display: none; text-align: center;">Mật khẩu không chính xác.</div>
                <button type="submit" class="auth-submit-btn" id="reauth-submit-btn" style="width: 100%; border-radius: 10px;">Xác nhận</button>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlayHtml);
    const overlay = document.getElementById('reauth-modal-overlay');
    const closeBtn = document.getElementById('close-reauth');

    // 1. Khi bấm nút X -> Đẩy về trang chủ
    closeBtn.onclick = () => {
        window.location.href = '/'; 
        // (Hoặc window.location.href = 'index.html'; tùy theo cách chạy dự án của bạn)
    };

    // 2. Khi bấm ra vùng tối bên ngoài popup -> Đẩy về trang chủ
    overlay.onclick = (e) => {
        // Chỉ kích hoạt nếu mục tiêu click chính xác là lớp phủ overlay (không phải cái form bên trong)
        if (e.target === overlay) {
            window.location.href = '/';
        }
    };
}

window.executeWithAuth = function(actionCallback) {
    // 1. THÊM ĐOẠN NÀY ĐỂ VƯỢT RÀO TẠM THỜI (Bỏ qua mọi bước check)
    // actionCallback(); 
    // return;

    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('accessToken');
    const userJson = localStorage.getItem('currentUser');

    if (!refreshToken || !userJson) {
        if (typeof showStatusPopup === 'function') {
            showStatusPopup(false, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
        } else {
            alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
        }
        setTimeout(() => window.location.href = 'auth.html', 1000);
        return;
    }

    const user = JSON.parse(userJson);

    if (accessToken) {
        actionCallback();
    } else {
        const modal = document.getElementById('reauth-modal-overlay');
        const title = document.getElementById('reauth-title');
        const form = document.getElementById('reauth-form');
        const error = document.getElementById('reauth-error');
        const submitBtn = document.getElementById('reauth-submit-btn');
        const mainContent = document.querySelector('main'); // Chọn phần thân trang

        if (modal) {
            title.textContent = `Chào ${user.fullName.split(' ').pop()}`; 
            error.style.display = 'none';
            modal.style.display = 'flex';
            
            // Áp dụng hiệu ứng làm mờ cho thân trang (Trừ Header)
            if (mainContent) mainContent.style.filter = 'blur(6px)';

            form.onsubmit = null; 
            form.onsubmit = async (e) => {
                e.preventDefault();
                const password = document.getElementById('reauth-password').value;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang xác thực...';

                try {
                    const res = await fetch('/api/auth/customer/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: user.phoneNumber, password: password }) 
                    }).then(r => r.json());

                    if (res.success || res.tokens) {
                        localStorage.setItem('accessToken', res.tokens.accessToken);
                        localStorage.setItem('refreshToken', res.tokens.refreshToken);
                        modal.style.display = 'none';
                        document.getElementById('reauth-password').value = '';
                        
                        // Bỏ làm mờ trang khi xác thực xong
                        if (mainContent) mainContent.style.filter = 'none';
                        
                        actionCallback();
                    } else {
                        error.textContent = res.message || 'Mật khẩu không chính xác.';
                        error.style.display = 'block';
                    }
                } catch (err) {
                    error.textContent = 'Lỗi kết nối máy chủ.';
                    error.style.display = 'block';
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Xác nhận';
                }
            };
        }
    }
};
}