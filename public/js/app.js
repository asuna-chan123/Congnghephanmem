/* ============================================================
   E-Tech Store — App Logic
   Apple-style scroll animations + API integration
   ============================================================ */

// ── State ──────────────────────────────────────────────────────
let homeData = null;

// ── Session ────────────────────────────────────────────────────
function getSessionId() {
    let id = localStorage.getItem('sessionId');
    if (!id) {
        id = 'session_' + Date.now() + Math.random().toString(36).substring(2);
        localStorage.setItem('sessionId', id);
    }
    return id;
}

// ── API Helper ─────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': getSessionId(),
            ...(options.headers || {})
        }
    });
    return res.json();
}

// ── Currency Format ────────────────────────────────────────────
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

// ── DOM References ─────────────────────────────────────────────
const dynamicCategories = document.getElementById('dynamic-categories');
const tryBeforeBuyContainer = document.getElementById('try-before-buy-container');

// ── Tag Labels ─────────────────────────────────────────────────
const categoryTagLabels = {
    1: [
        { tag: 'all', label: 'Tất cả' },
        { tag: 'gia-re', label: 'Giá rẻ' },
        { tag: 'chup-anh', label: 'Chụp ảnh đẹp' },
        { tag: 'hieu-nang', label: 'Hiệu năng cao' },
        { tag: 'pin-trau', label: 'Pin trâu' },
        { tag: 'mong-nhe', label: 'Mỏng nhẹ' }
    ],
    2: [
        { tag: 'all', label: 'Tất cả' },
        { tag: 'van-phong', label: 'Văn phòng' },
        { tag: 'sang-trong', label: 'Sang trọng' },
        { tag: 'mong-nhe', label: 'Mỏng nhẹ' },
        { tag: 'do-hoa', label: 'Đồ họa' },
        { tag: 'choi-game', label: 'Chơi game' }
    ],
    3: [
        { tag: 'all', label: 'Tất cả' },
        { tag: 'du-lich', label: 'Du lịch' },
        { tag: 'chuyen-nghiep', label: 'Chuyên nghiệp' },
        { tag: 'vlog', label: 'Vlog' },
        { tag: 'action-cam', label: 'Action Cam' },
        { tag: 'compact', label: 'Compact' }
    ]
};

/* ============================================================
   Scroll Reveal — IntersectionObserver
   ============================================================ */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

function observeReveal(el) {
    revealObserver.observe(el);
}

/* Observe static .reveal elements */
document.querySelectorAll('.reveal').forEach(observeReveal);

/* ============================================================
   Load Home Data
   ============================================================ */
async function loadHomeData() {
    if (!tryBeforeBuyContainer) return;
    try {
        const data = await fetch('/api/home-data').then(r => r.json());
        if (data.success) {
            homeData = data;
            document.getElementById('skeleton-loader')?.remove();
            renderTryBeforeBuy(data.tryBeforeBuy);
            initDropdownScrolls();
            checkUrlHashFilter();
        } else {
            tryBeforeBuyContainer.innerHTML =
                `<p style="color:var(--text-secondary);padding:40px;text-align:center;">
                    Không thể tải dữ liệu: ${data.message}
                 </p>`;
        }
    } catch (err) {
        console.error('Error fetching home data:', err);
        tryBeforeBuyContainer.innerHTML =
            `<p style="color:var(--text-secondary);padding:40px;text-align:center;">
                Lỗi kết nối máy chủ. Vui lòng thử lại sau.
             </p>`;
    }
}

/* ============================================================
   Render Categories
   ============================================================ */
/* Bento categories rendering moved to components-bento.js Custom Element */

/* ============================================================
   Build Product Card
   ============================================================ */
function buildProductCard(prod, idx = 0) {
    const outOfStock = prod.stock_quantity <= 0;
    const card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-product-tags', prod.tags || '');
    card.setAttribute('aria-label', prod.name);

    card.innerHTML = `
        <div class="product-image-container" role="img" aria-label="${prod.name}">
            ${prod.is_try_before_buy
            ? `<span class="trial-badge">Thuê trước</span>`
            : ''}
            <span class="stock-badge ${outOfStock ? 'out-of-stock' : ''}">
                ${outOfStock ? 'Hết hàng' : `Kho: ${prod.stock_quantity}`}
            </span>
            <img
                src="${prod.image_url || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&auto=format&fit=crop'}"
                alt="${prod.name}"
                loading="lazy"
                onclick="goToDetails(${prod.id})"
                style="cursor:pointer;"
            >
        </div>
        <div class="product-info">
            <h4 class="product-name" onclick="goToDetails(${prod.id})" style="cursor:pointer;" title="${prod.name}">
                ${prod.name}
            </h4>
            <div class="product-pricing">
                <div class="trial-price-row">
                    <i class="fa-solid fa-rotate" aria-hidden="true"></i>
                    ${formatCurrency(prod.trial_price_per_day)}<span style="font-size:12px;font-weight:400;color:var(--text-tertiary)">/ngày</span>
                </div>
                <div class="price-row">
                    Giá mua: ${formatCurrency(prod.price)}
                </div>
            </div>
            <div class="product-actions">
                <button
                    class="btn btn-primary btn-sm"
                    style="background:var(--success);"
                    onclick="goToDetails(${prod.id})"
                    ${outOfStock ? 'disabled' : ''}
                    aria-label="${outOfStock ? 'Hết hàng' : 'Thử ' + prod.name}"
                >
                    ${outOfStock ? 'Hết hàng' : 'Thử trước'}
                </button>
                <button
                    class="btn btn-outline btn-sm"
                    onclick="addToCart(${prod.id}, 'buy')"
                    ${outOfStock ? 'disabled' : ''}
                    aria-label="Mua ${prod.name}"
                >
                    Mua ngay
                </button>
            </div>
        </div>
    `;
    return card;
}

/* ============================================================
   Filter by Tag
   ============================================================ */
function filterCategoryProducts(categoryId, tag) {
    const carousel = document.getElementById(`carousel-cat-${categoryId}`);
    if (!carousel) return;
    carousel.querySelectorAll('.product-card').forEach(card => {
        if (tag === 'all') {
            card.style.display = '';
            return;
        }
        const tags = (card.getAttribute('data-product-tags') || '').split(',').map(t => t.trim());
        card.style.display = tags.includes(tag) ? '' : 'none';
    });
}

/* ============================================================
   Navigate to product detail
   ============================================================ */
function goToDetails(productId) {
    window.location.href = `/product.html?id=${productId}`;
}

/* ============================================================
   Render Try Before Buy
   ============================================================ */
/* ============================================================
   Render Try Before Buy
   ============================================================ */
function renderTryBeforeBuy(products) {
    if (!tryBeforeBuyContainer) return;
    tryBeforeBuyContainer.innerHTML = '';

    products.forEach((prod, idx) => {
        const card = document.createElement('product-card');
        card.setAttribute('product-id', prod.id);
        card.setAttribute('name', prod.name);
        card.setAttribute('price', prod.price);
        card.setAttribute('image-url', prod.image_url || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&auto=format&fit=crop');
        card.setAttribute('tags', prod.tags || '');
        card.style.minWidth = 'unset';
        card.style.maxWidth = '100%';
        card.style.transitionDelay = `${idx * 0.07}s`;

        tryBeforeBuyContainer.appendChild(card);
        
        // Wait for Custom Element rendering to observe internal card element
        setTimeout(() => {
            const innerCard = card.querySelector('.product-card, .apple-product-card');
            if (innerCard) observeReveal(innerCard);
        }, 50);
    });
}

/* ============================================================
   Dropdown — Smooth scroll for hash links
   ============================================================ */
function initDropdownScrolls() {
    const menu = document.getElementById('category-dropdown-menu');
    if (!menu) return;
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const id = href.slice(1);
                const el = document.getElementById(id);
                if (el) {
                    const headerH = document.querySelector('.main-header')?.offsetHeight || 52;
                    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerH - 20, behavior: 'smooth' });

                    /* Auto-activate tag */
                    const tag = link.getAttribute('data-tag');
                    if (tag) {
                        const catId = id === 'category-dien-thoai' ? 1
                            : id === 'category-laptop' ? 2
                                : id === 'category-may-anh' ? 3 : null;
                        if (catId) {
                            const btn = document.querySelector(`#filters-cat-${catId} [data-tag="${tag}"]`);
                            btn?.click();
                        }
                    }
                }
                menu.classList.remove('show');
            }
        });
    });
}

/* ============================================================
   URL Hash on load
   ============================================================ */
function checkUrlHashFilter() {
    const hash = window.location.hash;
    if (!hash) return;
    setTimeout(() => {
        const el = document.getElementById(hash.slice(1));
        el?.scrollIntoView({ behavior: 'smooth' });
    }, 350);
}

/* ============================================================
   Cart
   ============================================================ */
async function loadCart() {
    try {
        const data = await apiFetch('/api/cart');
        if (data.success) updateCartUI(data.cart.length);
    } catch (e) {
        console.error('Cart load error:', e);
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
            console.error('Add to cart failed:', res.message);
        }
    } catch (e) {
        console.error('Add to cart error:', e);
    }
}

function updateCartUI(count) {
    const header = document.querySelector('custom-header');
    if (header && typeof header.updateCartCount === 'function') {
        header.updateCartCount(count);
    } else {
        document.querySelectorAll('.cart-count').forEach(b => { b.textContent = count; });
    }
}

/* ============================================================
   Init
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadHomeData();
});
