// State Management
let homeData = null;

// Session Management
function getSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + Math.random().toString(36).substring(2);
        localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

// API Fetch Helper
async function apiFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'X-Session-Id': getSessionId(),
        ...(options.headers || {})
    };
    const res = await fetch(url, { ...options, headers });
    return await res.json();
}

// DOM Elements
const dynamicCategories = document.getElementById('dynamic-categories');
const combosContainer = document.getElementById('combos-container');
const tryBeforeBuyContainer = document.getElementById('try-before-buy-container');

// Helper to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

// Tag labels definitions for filtering
const categoryTagLabels = {
    1: [ // Phone
        { tag: 'all', label: 'Tất cả' },
        { tag: 'gia-re', label: 'Giá rẻ' },
        { tag: 'chup-anh', label: 'Chụp ảnh đẹp' },
        { tag: 'hieu-nang', label: 'Hiệu năng cao' },
        { tag: 'pin-trau', label: 'Pin trâu' },
        { tag: 'mong-nhe', label: 'Mỏng nhẹ' }
    ],
    2: [ // Laptop
        { tag: 'all', label: 'Tất cả' },
        { tag: 'van-phong', label: 'Thiết bị văn phòng' },
        { tag: 'sang-trong', label: 'Sang trọng' },
        { tag: 'mong-nhe', label: 'Mỏng nhẹ' },
        { tag: 'do-hoa', label: 'Đồ họa' },
        { tag: 'choi-game', label: 'Chơi game' }
    ],
    3: [ // Camera
        { tag: 'all', label: 'Tất cả' },
        { tag: 'du-lich', label: 'Du lịch' },
        { tag: 'chuyen-nghiep', label: 'Chuyên nghiệp' },
        { tag: 'vlog', label: 'Vlog' },
        { tag: 'action-cam', label: 'Action Cam' },
        { tag: 'compact', label: 'Compact' }
    ]
};

// Fetch and Render Home Page Data
async function loadHomeData() {
    if (!dynamicCategories) return;
    try {
        const response = await fetch('/api/home-data');
        const data = await response.json();

        if (data.success) {
            homeData = data;
            renderCategories(data.categories);
            renderCombos(data.combos);
            renderTryBeforeBuy(data.tryBeforeBuy);
            initDropdownScrolls();
            checkUrlHashFilter();
        } else {
            dynamicCategories.innerHTML = `<div class="error-msg">Không thể tải dữ liệu: ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Error fetching home data:', error);
        dynamicCategories.innerHTML = `<div class="error-msg">Lỗi kết nối máy chủ. Vui lòng thử lại sau.</div>`;
    }
}

// Render Category Carousels with Filter Pills
function renderCategories(categories) {
    dynamicCategories.innerHTML = '';

    categories.forEach(cat => {
        if (!cat.products || cat.products.length === 0) return;

        const categorySection = document.createElement('div');
        categorySection.className = 'category-carousel-section';
        categorySection.id = `category-${cat.slug}`;

        // Title block
        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'section-title-wrapper';
        titleWrapper.style.margin = '40px 0 15px 0';
        titleWrapper.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <h3 class="section-title" style="font-size: 22px; margin: 0;">${cat.name}</h3>
                <a href="/products.html?category=${cat.slug}" class="view-all-link" style="color: var(--primary-color); font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 5px; font-size: 14px; transition: var(--transition);">
                    Xem tất cả <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
        `;
        categorySection.appendChild(titleWrapper);

        // Filter Pills container
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'category-filters-container';
        filtersContainer.id = `filters-cat-${cat.id}`;

        const tagsList = categoryTagLabels[cat.id] || [];
        tagsList.forEach(item => {
            const btn = document.createElement('button');
            btn.className = `tag-filter-btn ${item.tag === 'all' ? 'active' : ''}`;
            btn.setAttribute('data-tag', item.tag);
            btn.textContent = item.label;

            btn.addEventListener('click', () => {
                // Remove active class from sibling buttons
                filtersContainer.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Perform product card filtering
                filterCategoryProducts(cat.id, item.tag);
            });
            filtersContainer.appendChild(btn);
        });
        categorySection.appendChild(filtersContainer);

        // Carousel Slider
        const carouselWrapper = document.createElement('div');
        carouselWrapper.className = 'carousel-wrapper';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-nav-btn carousel-prev';
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-nav-btn carousel-next';
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'carousel-container';
        carouselContainer.id = `carousel-cat-${cat.id}`;

        cat.products.forEach(prod => {
            const isOutOfStock = prod.stock_quantity <= 0;
            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.cursor = 'pointer';
            // Save tags as datasets for quick filtering
            card.setAttribute('data-product-tags', prod.tags || '');

            card.innerHTML = `
                <div class="product-image-container" onclick="goToDetails(${prod.id})">
                    ${prod.is_try_before_buy ? '<span class="trial-badge" style="background-color: #059669;">Thuê trước</span>' : ''}
                    <span class="stock-badge ${isOutOfStock ? 'out-of-stock' : ''}">
                        ${isOutOfStock ? 'Hết hàng' : `Kho: ${prod.stock_quantity}`}
                    </span>
                    <img src="${prod.image_url || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500'}" alt="${prod.name}">
                </div>
                <div class="product-info">
                    <h4 class="product-name" title="${prod.name}" onclick="goToDetails(${prod.id})">${prod.name}</h4>
                    <div class="product-pricing">
                        <div class="trial-price-row" style="font-size: 16px; font-weight: 800; color: #059669; margin-bottom: 4px;">
                            <i class="fa-solid fa-rotate"></i> ${formatCurrency(prod.trial_price_per_day)}/ngày
                        </div>
                        <div class="price-row">
                            <span style="font-size: 12px; color: var(--text-muted);">Giá mua: ${formatCurrency(prod.price)}</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary" style="background-color: #059669; border-color: #059669;" onclick="goToDetails(${prod.id})" ${isOutOfStock ? 'disabled' : ''}>
                            ${isOutOfStock ? 'Hết hàng' : 'Thử trước'}
                        </button>
                        <button class="btn btn-outline" onclick="addToCart(${prod.id}, 'buy')" ${isOutOfStock ? 'disabled' : ''}>
                            Mua ngay
                        </button>
                    </div>
                </div>
            `;
            carouselContainer.appendChild(card);
        });

        carouselWrapper.appendChild(prevBtn);
        carouselWrapper.appendChild(carouselContainer);
        carouselWrapper.appendChild(nextBtn);
        categorySection.appendChild(carouselWrapper);
        dynamicCategories.appendChild(categorySection);

        // Scroll button actions
        prevBtn.addEventListener('click', () => {
            carouselContainer.scrollBy({ left: -300, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
            carouselContainer.scrollBy({ left: 300, behavior: 'smooth' });
        });
    });
}

// Client-side filtering implementation
function filterCategoryProducts(categoryId, activeTag) {
    const carousel = document.getElementById(`carousel-cat-${categoryId}`);
    if (!carousel) return;

    const cards = carousel.querySelectorAll('.product-card');
    cards.forEach(card => {
        if (activeTag === 'all') {
            card.style.display = 'flex';
            return;
        }

        const tagsAttr = card.getAttribute('data-product-tags') || '';
        const productTags = tagsAttr.split(',').map(t => t.trim());

        if (productTags.includes(activeTag)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function goToDetails(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Render Combos ("Gói Nhu Cầu")
function renderCombos(combos) {
    combosContainer.innerHTML = '';

    combos.forEach(combo => {
        const isOutOfStock = combo.stock_quantity <= 0;
        const itemsLi = combo.products.map(p => `
            <li><i class="fa-solid fa-check"></i> ${p.name}</li>
        `).join('');

        const comboCard = document.createElement('div');
        comboCard.className = 'combo-card';
        comboCard.innerHTML = `
            <div class="combo-image-box">
                <span class="combo-stock">Kho: ${combo.stock_quantity}</span>
                <img src="${combo.image_url || 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=500'}" alt="${combo.name}">
            </div>
            <div class="combo-info">
                <h4 class="combo-title">${combo.name}</h4>
                <p class="combo-desc">${combo.description}</p>
                <div class="combo-items-list">
                    <h5>Sản phẩm trong gói:</h5>
                    <ul>
                        ${itemsLi}
                    </ul>
                </div>
                <div class="combo-pricing">
                    <div class="combo-price-details">
                        ${combo.original_price ? `<span class="combo-original-price">${formatCurrency(combo.original_price)}</span>` : ''}
                        <span class="combo-current-price">${formatCurrency(combo.price)}</span>
                    </div>
                    <button class="btn btn-primary" onclick="addComboToCart(${combo.id})" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Hết hàng' : 'Chọn Gói Nhu Cầu'}
                    </button>
                </div>
            </div>
        `;
        combosContainer.appendChild(comboCard);
    });
}

// Render Try Before Buy Products
function renderTryBeforeBuy(products) {
    tryBeforeBuyContainer.innerHTML = '';

    products.forEach(prod => {
        const isOutOfStock = prod.stock_quantity <= 0;
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.minWidth = 'auto';
        card.style.maxWidth = '100%';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="product-image-container" onclick="goToDetails(${prod.id})">
                <span class="trial-badge" style="background-color: #059669;">Dùng thử trước</span>
                <span class="stock-badge ${isOutOfStock ? 'out-of-stock' : ''}">
                    ${isOutOfStock ? 'Hết hàng' : `Kho: ${prod.stock_quantity}`}
                </span>
                <img src="${prod.image_url || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500'}" alt="${prod.name}">
            </div>
            <div class="product-info">
                <h4 class="product-name" title="${prod.name}" onclick="goToDetails(${prod.id})">${prod.name}</h4>
                <div class="product-pricing">
                    <div class="trial-price-row" style="font-size: 16px; font-weight: 800; color: #059669; margin-bottom: 4px;">
                        ${formatCurrency(prod.trial_price_per_day)} <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);">/ ngày</span>
                    </div>
                    <div class="price-row">
                        <span style="font-size: 12px; color: var(--text-muted);">Giá mua đứt: ${formatCurrency(prod.price)}</span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" style="background-color: #059669; border-color: #059669; width: 100%;" onclick="goToDetails(${prod.id})" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Hết hàng' : 'Đăng ký dùng thử'}
                    </button>
                </div>
            </div>
        `;
        tryBeforeBuyContainer.appendChild(card);
    });
}

// Note: Category Dropdown Toggle is handled by the custom-header element in components.js


// Category Dropdown Subcategory Navigation Handler
function initDropdownScrolls() {
    const dropdownMenu = document.getElementById('category-dropdown-menu');
    if (!dropdownMenu) return;
    const links = dropdownMenu.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetHash = link.getAttribute('href');
            if (targetHash && targetHash.startsWith('#')) {
                e.preventDefault();
                const targetId = targetHash.split('#')[1];
                const targetTag = link.getAttribute('data-tag');

                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const headerHeight = document.querySelector('.main-header').offsetHeight;
                    const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                    const offsetPosition = elementPosition - headerHeight - 20;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Auto-activate corresponding tag filter
                    if (targetTag) {
                        let catId = null;
                        if (targetId === 'category-dien-thoai') catId = 1;
                        else if (targetId === 'category-laptop') catId = 2;
                        else if (targetId === 'category-may-anh') catId = 3;

                        if (catId) {
                            const filtersBox = document.getElementById(`filters-cat-${catId}`);
                            if (filtersBox) {
                                const btn = filtersBox.querySelector(`[data-tag="${targetTag}"]`);
                                if (btn) btn.click();
                            }
                        }
                    }
                }
            }
            dropdownMenu.classList.remove('show');
        });
    });
}

// Check URL Hash on load (e.g. if loaded from detail page dropdown link)
function checkUrlHashFilter() {
    const hash = window.location.hash;
    if (hash) {
        setTimeout(() => {
            const targetId = hash.split('#')[1];
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 300);
    }
}

// Shopping Cart Actions
async function loadCart() {
    try {
        const data = await apiFetch('/api/cart');
        if (data.success) {
            updateCartUI(data.cart.length);
        }
    } catch (e) {
        console.error('Error loading cart', e);
    }
}

async function addToCart(productId, type = 'buy') {
    try {
        const res = await apiFetch('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId, type })
        });
        if (res.success) {
            window.location.href = '/cart.html';
        } else {
            alert('Lỗi: ' + res.message);
        }
    } catch (e) {
        console.error('Error adding to cart', e);
        alert('Lỗi thêm vào giỏ hàng');
    }
}

async function addComboToCart(comboId) {
    try {
        const res = await apiFetch('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({ comboId, type: 'combo' })
        });
        if (res.success) {
            window.location.href = '/cart.html';
        } else {
            alert('Lỗi: ' + res.message);
        }
    } catch (e) {
        console.error('Error adding to cart', e);
        alert('Lỗi thêm vào giỏ hàng');
    }
}

function updateCartUI(count) {
    const header = document.querySelector('custom-header');
    if (header && typeof header.updateCartCount === 'function') {
        header.updateCartCount(count);
    } else {
        const badges = document.querySelectorAll('.cart-count');
        badges.forEach(badge => {
            badge.textContent = count;
        });
    }
}

// Note: Theme toggling and header scrolling are managed inside components.js or automatically by custom elements.


// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadHomeData();
});
