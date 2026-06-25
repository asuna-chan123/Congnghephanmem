class CustomHeader extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.setupTheme();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = `
        <header class="main-header">
            <div class="header-container">
                <div class="logo-area">
                    <a href="/" class="logo">E-Tech<span>Store</span></a>
                </div>
                
                <div class="search-area-wrapper">
                    <div class="search-bar-container">
                        <div class="category-dropdown-btn" id="category-dropdown-btn">
                            Danh mục <i class="fa-solid fa-chevron-down"></i>
                            <div class="category-dropdown-menu" id="category-dropdown-menu">
                                <div class="dropdown-grid">
                                    <div class="dropdown-col">
                                        <h4><i class="fa-solid fa-mobile-screen-button"></i> Điện thoại</h4>
                                        <a href="/products.html?category=dien-thoai">Tất cả điện thoại</a>
                                        <a href="/products.html?category=dien-thoai&tag=gia-re">Giá rẻ</a>
                                        <a href="/products.html?category=dien-thoai&tag=chup-anh">Chụp ảnh đẹp</a>
                                        <a href="/products.html?category=dien-thoai&tag=hieu-nang">Hiệu năng cao</a>
                                        <a href="/products.html?category=dien-thoai&tag=pin-trau">Pin trâu</a>
                                        <a href="/products.html?category=dien-thoai&tag=mong-nhe">Mỏng nhẹ</a>
                                    </div>
                                    <div class="dropdown-col">
                                        <h4><i class="fa-solid fa-laptop"></i> Laptop</h4>
                                        <a href="/products.html?category=laptop">Tất cả laptop</a>
                                        <a href="/products.html?category=laptop&tag=van-phong">Văn phòng</a>
                                        <a href="/products.html?category=laptop&tag=sang-trong">Sang trọng</a>
                                        <a href="/products.html?category=laptop&tag=mong-nhe">Mỏng nhẹ</a>
                                        <a href="/products.html?category=laptop&tag=do-hoa">Đồ họa</a>
                                        <a href="/products.html?category=laptop&tag=choi-game">Chơi game</a>
                                    </div>
                                    <div class="dropdown-col">
                                        <h4><i class="fa-solid fa-camera"></i> Máy ảnh</h4>
                                        <a href="/products.html?category=may-anh">Tất cả máy ảnh</a>
                                        <a href="/products.html?category=may-anh&tag=du-lich">Du lịch</a>
                                        <a href="/products.html?category=may-anh&tag=chuyen-nghiep">Chuyên nghiệp</a>
                                        <a href="/products.html?category=may-anh&tag=vlog">Vlog</a>
                                        <a href="/products.html?category=may-anh&tag=action-cam">Action Cam</a>
                                        <a href="/products.html?category=may-anh&tag=compact">Compact</a>
                                    </div>
                                </div>
                                <div class="dropdown-footer-row">
                                    <a href="/products.html" class="view-all-categories-btn">Hiển thị tất cả thiết bị công nghệ</a>
                                </div>
                            </div>
                        </div>
                        <form class="search-form" action="/products.html" method="GET">
                            <input type="text" name="search" id="header-search-input" placeholder="Tìm kiếm bất kỳ thiết bị công nghệ nào..." aria-label="Search">
                            <button type="submit" class="search-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
                        </form>
                    </div>
                    <div class="search-suggestions" id="search-suggestions">
                        <span class="suggestion-title-label">Đề xuất:</span>
                        <a href="/#try-before-buy"><i class="fa-solid fa-gift"></i> Quà tặng</a>
                        <a href="/#combo-packages"><i class="fa-solid fa-cubes"></i> Gói theo nhu cầu</a>
                        <a href="/#category-dien-thoai"><i class="fa-solid fa-fire"></i> Sản phẩm hot</a>
                        <a href="/#try-before-buy"><i class="fa-solid fa-circle-check"></i> Phù hợp với bạn</a>
                    </div>
                </div>

                <div class="header-actions">
                    <button class="action-btn" id="theme-toggle" title="Đổi giao diện">
                        <i class="fa-solid fa-moon"></i>
                    </button>
                    <a href="#" class="action-link sign-in-btn">Đăng nhập</a>
                    <a href="/favorites.html" class="action-btn favorite-btn"><i class="fa-regular fa-heart"></i></a>
                    <a href="/cart.html" class="action-btn cart-btn-toggle" id="cart-toggle-btn">
                        <i class="fa-solid fa-bag-shopping"></i>
                        <span class="cart-count">0</span>
                    </a>
                </div>
            </div>
        </header>
        `;
    }

    setupTheme() {
        const themeToggle = this.querySelector('#theme-toggle');
        if (!themeToggle) return;

        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    updateThemeIcon(theme) {
        const themeToggle = this.querySelector('#theme-toggle');
        if (!themeToggle) return;
        const icon = themeToggle.querySelector('i');
        if (!icon) return;

        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    setupEventListeners() {
        // Dropdown Toggle
        const categoryDropdownBtn = this.querySelector('#category-dropdown-btn');
        const categoryDropdownMenu = this.querySelector('#category-dropdown-menu');

        if (categoryDropdownBtn && categoryDropdownMenu) {
            categoryDropdownBtn.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.closest('#category-dropdown-menu a')) {
                    return;
                }
                e.stopPropagation();
                categoryDropdownMenu.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                categoryDropdownMenu.classList.remove('show');
            });
        }

        // Theme Toggle
        const themeToggle = this.querySelector('#theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Cart Toggle
        const cartToggleBtn = this.querySelector('#cart-toggle-btn');
        if (cartToggleBtn) {
            cartToggleBtn.addEventListener('click', () => {
                window.location.href = '/cart.html';
            });
        }

        // Sticky Header on Scroll
        window.addEventListener('scroll', () => {
            const header = this.querySelector('.main-header');
            if (header) {
                if (window.scrollY > 80) {
                    header.classList.add('shrunk');
                } else {
                    header.classList.remove('shrunk');
                }
            }
        });

        // Dropdown Subcategory Navigation Handler (Smooth Scroll if targets exist)
        if (categoryDropdownMenu) {
            const links = categoryDropdownMenu.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    const targetHref = link.getAttribute('href');
                    if (targetHref && targetHref.startsWith('/#')) {
                        // Check if we are already on home page
                        if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
                            e.preventDefault();
                            const targetId = targetHref.split('#')[1];
                            const targetElement = document.getElementById(targetId);
                            if (targetElement) {
                                const headerHeight = this.querySelector('.main-header').offsetHeight;
                                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                                const offsetPosition = elementPosition - headerHeight - 20;

                                window.scrollTo({
                                    top: offsetPosition,
                                    behavior: 'smooth'
                                });
                            }
                            categoryDropdownMenu.classList.remove('show');
                        }
                    }
                });
            });
        }
    }

    updateCartCount(count) {
        const badges = this.querySelectorAll('.cart-count');
        badges.forEach(badge => {
            badge.textContent = count;
        });
    }
}

class CustomFooter extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
        <footer class="main-footer">
            <div class="footer-container">
                <div class="footer-brand">
                    <a href="/" class="logo">E-Tech<span>Store</span></a>
                    <p>Nâng tầm trải nghiệm công nghệ của bạn bằng các dịch vụ mua sắm linh hoạt, hỗ trợ dùng thử trước khi mua hàng đầu Việt Nam.</p>
                    <div class="social-links">
                        <a href="#"><i class="fa-brands fa-facebook"></i></a>
                        <a href="#"><i class="fa-brands fa-instagram"></i></a>
                        <a href="#"><i class="fa-brands fa-youtube"></i></a>
                        <a href="#"><i class="fa-brands fa-tiktok"></i></a>
                    </div>
                </div>
                
                <div class="footer-links">
                    <h4>Về E-Tech</h4>
                    <ul>
                        <li><a href="#">Giới thiệu</a></li>
                        <li><a href="#">Tuyển dụng</a></li>
                        <li><a href="#">Báo chí</a></li>
                        <li><a href="#">Chính sách bảo mật</a></li>
                    </ul>
                </div>

                <div class="footer-links">
                    <h4>Hỗ trợ khách hàng</h4>
                    <ul>
                        <li><a href="#">Trung tâm trợ giúp</a></li>
                        <li><a href="#">Chính sách dùng thử</a></li>
                        <li><a href="#">Chính sách đổi trả</a></li>
                        <li><a href="#">Liên hệ hỗ trợ</a></li>
                    </ul>
                </div>

                <div class="footer-subscribe">
                    <h4>Đăng ký nhận tin tức</h4>
                    <p>Nhận các mã giảm giá đặc biệt và thông tin sản phẩm mới nhất.</p>
                    <form class="subscribe-form" onsubmit="event.preventDefault(); alert('Cảm ơn bạn đã đăng ký!');">
                        <input type="email" placeholder="Email của bạn..." required>
                        <button type="submit">Đăng ký</button>
                    </form>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 E-Tech Store. All rights reserved. Thiết kế tương tự phong cách Etsy.</p>
            </div>
        </footer>
        `;
    }
}

customElements.define('custom-header', CustomHeader);
customElements.define('custom-footer', CustomFooter);
