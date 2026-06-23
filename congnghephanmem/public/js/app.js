// State Management
let cart = [];
let homeData = null;

// DOM Elements
const dynamicCategories = document.getElementById('dynamic-categories');
const combosContainer = document.getElementById('combos-container');
const tryBeforeBuyContainer = document.getElementById('try-before-buy-container');
const themeToggle = document.getElementById('theme-toggle');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsList = document.getElementById('cart-items-list');
const cartDrawerCount = document.getElementById('cart-drawer-count');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartCountBadges = document.querySelectorAll('.cart-count');
const categoryDropdownBtn = document.getElementById('category-dropdown-btn');
const categoryDropdownMenu = document.getElementById('category-dropdown-menu');

// Helper to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

// Fetch and Render Home Page Data
async function loadHomeData() {
    try {
        const response = await fetch('/api/home-data');
        const data = await response.json();
        
        if (data.success) {
            homeData = data;
            renderCategories(data.categories);
            renderCombos(data.combos);
            renderTryBeforeBuy(data.tryBeforeBuy);
            initDropdownScrolls();
        } else {
            dynamicCategories.innerHTML = `<div class="error-msg">Không thể tải dữ liệu: ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Error fetching home data:', error);
        dynamicCategories.innerHTML = `<div class="error-msg">Lỗi kết nối máy chủ. Vui lòng thử lại sau.</div>`;
    }
}

// Render Category Carousels
function renderCategories(categories) {
    dynamicCategories.innerHTML = '';
    
    categories.forEach(cat => {
        if (!cat.products || cat.products.length === 0) return;
        
        const categorySection = document.createElement('div');
        categorySection.className = 'category-carousel-section';
        categorySection.id = `category-${cat.slug}`;
        
        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'section-title-wrapper';
        titleWrapper.innerHTML = `
            <div>
                <h3 class="section-title" style="font-size: 22px;">${cat.name}</h3>
            </div>
        `;
        categorySection.appendChild(titleWrapper);

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
        
        cat.products.forEach(prod => {
            const isOutOfStock = prod.stock_quantity <= 0;
            const card = document.createElement('div');
            card.className = 'product-card';
            // Click card to open details
            card.style.cursor = 'pointer';
            
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
                        <!-- Rental price on top, larger and bold -->
                        <div class="trial-price-row" style="font-size: 16px; font-weight: 800; color: #059669; margin-bottom: 4px;">
                            <i class="fa-solid fa-rotate"></i> ${formatCurrency(prod.trial_price_per_day)}/ngày
                        </div>
                        <div class="price-row">
                            <span style="font-size: 12px; color: var(--text-muted);">Giá mua: ${formatCurrency(prod.price)}</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <!-- Try before buy is green and prominent -->
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
        
        // Add scroll behavior to buttons
        prevBtn.addEventListener('click', () => {
            carouselContainer.scrollBy({ left: -300, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
            carouselContainer.scrollBy({ left: 300, behavior: 'smooth' });
        });
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
        
        // Render listed products in combo
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
        card.style.minWidth = 'auto'; // allow responsive grid sizing
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
                    <!-- Rental price on top, larger and bold -->
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

// Category Dropdown Toggle
categoryDropdownBtn.addEventListener('click', (e) => {
    // If the click is inside the dropdown list on a link, don't close immediately here
    if (e.target.tagName === 'A' || e.target.closest('#category-dropdown-menu a')) {
        return;
    }
    e.stopPropagation();
    categoryDropdownMenu.classList.toggle('show');
});

document.addEventListener('click', () => {
    categoryDropdownMenu.classList.remove('show');
});

// Category Dropdown Scroll Links
function initDropdownScrolls() {
    const links = categoryDropdownMenu.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').split('#')[1];
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.main-header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - headerHeight - 20;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
            categoryDropdownMenu.classList.remove('show');
        });
    });
}

// Shopping Cart Actions
function addToCart(productId, type = 'buy') {
    // Find product details
    let product = null;
    
    // Scan standard category products
    if (homeData && homeData.categories) {
        for (const cat of homeData.categories) {
            const found = cat.products.find(p => p.id === productId);
            if (found) { product = found; break; }
        }
    }
    
    // Scan extra items or try before buy products
    if (!product && homeData && homeData.tryBeforeBuy) {
        product = homeData.tryBeforeBuy.find(p => p.id === productId);
    }
    
    if (!product) return;
    
    // Define item price based on action type
    const itemPrice = type === 'trial' ? product.trial_price_per_day : product.price;
    const itemTitle = type === 'trial' ? `${product.name} (Dùng thử 1 ngày)` : product.name;
    const itemTypeName = type === 'trial' ? 'Dùng thử' : 'Mua đứt';

    const cartItem = {
        uniqueId: Date.now() + Math.random().toString(36).substr(2, 9),
        id: product.id,
        name: itemTitle,
        price: itemPrice,
        image: product.image_url,
        type: itemTypeName
    };
    
    cart.push(cartItem);
    updateCartUI();
    openCart();
}

function addComboToCart(comboId) {
    if (!homeData || !homeData.combos) return;
    
    const combo = homeData.combos.find(c => c.id === comboId);
    if (!combo) return;
    
    const cartItem = {
        uniqueId: Date.now() + Math.random().toString(36).substr(2, 9),
        id: combo.id,
        name: combo.name,
        price: combo.price,
        image: combo.image_url,
        type: 'Gói Combo'
    };
    
    cart.push(cartItem);
    updateCartUI();
    openCart();
}

function removeCartItem(uniqueId) {
    cart = cart.filter(item => item.uniqueId !== uniqueId);
    updateCartUI();
}

function updateCartUI() {
    // Update Counts
    cartCountBadges.forEach(badge => {
        badge.textContent = cart.length;
    });
    cartDrawerCount.textContent = cart.length;
    
    // Update List
    if (cart.length === 0) {
        cartItemsList.innerHTML = `
            <div class="empty-cart-message">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Giỏ hàng của bạn đang trống.</p>
            </div>
        `;
        cartSubtotal.textContent = formatCurrency(0);
    } else {
        cartItemsList.innerHTML = '';
        let total = 0;
        
        cart.forEach(item => {
            total += item.price;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.image || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500'}" alt="${item.name}">
                <div class="cart-item-info">
                    <h5 class="cart-item-title" style="font-size: 13px;">${item.name}</h5>
                    <span class="cart-item-type">${item.type}</span>
                    <div class="cart-item-price">${formatCurrency(item.price)}</div>
                </div>
                <button class="remove-cart-item" onclick="removeCartItem('${item.uniqueId}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            cartItemsList.appendChild(itemElement);
        });
        
        cartSubtotal.textContent = formatCurrency(total);
    }
}

// Drawer Toggle Functions
function openCart() {
    cartDrawer.classList.add('open');
}

function closeCart() {
    cartDrawer.classList.remove('open');
}

// Theme Switcher (Light / Dark)
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

// Sticky header on scroll (adds static shadow only)
window.addEventListener('scroll', () => {
    const header = document.querySelector('.main-header');
    if (window.scrollY > 80) {
        header.classList.add('shrunk');
    } else {
        header.classList.remove('shrunk');
    }
});

// Event Listeners
themeToggle.addEventListener('click', toggleTheme);
cartToggleBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Giỏ hàng trống! Hãy chọn mua hoặc dùng thử sản phẩm.');
    } else {
        alert('Cảm ơn bạn đã đặt hàng demo! Hệ thống đã ghi nhận thành công.');
        cart = [];
        updateCartUI();
        closeCart();
    }
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadHomeData();
});
