/* ============================================================
   Custom Header Component — Apple-Inspired with GSAP Animations
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
                const user = JSON.parse(currentUserJson);
                userSectionHtml = `
                    <span style="font-size: 12px; color: var(--text-primary); opacity: 0.9; font-weight: 500;">Hi, ${user.fullName}</span>
                    <span style="font-size: 11px; opacity: 0.3; color: var(--text-primary);">|</span>
                    <a href="#" class="action-link" id="signout-link" style="background: transparent; color: var(--text-primary); font-size: 12px; font-weight: 400; padding: 0; opacity: 0.8; transition: opacity 0.2s;">Đăng xuất</a>
                `;
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        }
        if (!userSectionHtml) {
            userSectionHtml = `
                <a href="#" class="action-link sign-in-btn" id="signin-link" style="background: transparent; color: var(--text-primary); font-size: 12px; font-weight: 400; padding: 0; opacity: 0.8; transition: opacity 0.2s;">Đăng nhập</a>
                <span style="font-size: 11px; opacity: 0.3; color: var(--text-primary);">|</span>
                <a href="#" class="action-link sign-up-btn" id="signup-link" style="background: transparent; color: var(--text-primary); font-size: 12px; font-weight: 400; padding: 0; opacity: 0.8; transition: opacity 0.2s;">Đăng ký</a>
            `;
        }

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
                <nav class="header-actions" aria-label="Tài khoản và giỏ hàng" style="gap: 12px; align-items: center;">
                    ${userSectionHtml}
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
                    ${currentUserJson ? `
                    <a href="/profile" class="action-btn profile-btn" aria-label="Hồ sơ" style="width: auto; height: auto; font-size: 13px; opacity: 0.8;">
                        <i class="fa-solid fa-user" aria-hidden="true"></i>
                    </a>
                    <a href="/orders.html" class="action-btn orders-btn" aria-label="Đơn hàng" style="width: auto; height: auto; font-size: 13px; opacity: 0.8;">
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
                  <a class="sm-panel-item" href="/" aria-label="Trang chủ">
                    <span class="sm-panel-itemLabel">Trang chủ</span>
                  </a>
                </li>
                <li class="sm-panel-itemWrap">
                  <a class="sm-panel-item" href="/products.html?category=dien-thoai" aria-label="Điện thoại">
                    <span class="sm-panel-itemLabel">Điện thoại</span>
                  </a>
                </li>
                <li class="sm-panel-itemWrap">
                  <a class="sm-panel-item" href="/products.html?category=laptop" aria-label="Laptop">
                    <span class="sm-panel-itemLabel">Laptop</span>
                  </a>
                </li>
                <li class="sm-panel-itemWrap">
                  <a class="sm-panel-item" href="/products.html?category=may-anh" aria-label="Máy ảnh">
                    <span class="sm-panel-itemLabel">Máy ảnh</span>
                  </a>
                </li>
                <li class="sm-panel-itemWrap">
                  <a class="sm-panel-item" href="/cart.html" aria-label="Giỏ hàng">
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

        // Initialize GSAP states
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

        this.setupStaggeredLayers();

        // Initialize auth modals on the page
        if (typeof initAuthModals === 'function') {
            initAuthModals();
        }

        const signinLink = this.querySelector('#signin-link');
        const signupLink = this.querySelector('#signup-link');
        const signoutLink = this.querySelector('#signout-link');

        if (signinLink) {
            signinLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.openSignInModal();
            });
        }
        if (signupLink) {
            signupLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.openSignUpModal();
            });
        }
        if (signoutLink) {
            signoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('currentUser');
                if (typeof window.showStatusPopup === 'function') {
                    window.showStatusPopup(true, 'Đã đăng xuất thành công.');
                }
                setTimeout(() => window.location.reload(), 1000);
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

customElements.define('custom-header', CustomHeader);
