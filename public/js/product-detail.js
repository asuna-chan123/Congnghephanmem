// State variables
let product = null;
let reviews = [];
let rentals = [];
let isFavorited = false;
let currentSelectedImage = '';

// DOM Elements
const detailLayout = document.getElementById('product-detail-layout');
const relatedContainer = document.getElementById('related-products-container');
const avgRatingVal = document.getElementById('avg-rating-val');
const avgStarsContainer = document.getElementById('avg-stars-container');
const reviewsCountLabel = document.getElementById('reviews-count-label');
const reviewsListContainer = document.getElementById('reviews-list-container');

// Extract Product ID
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// Formatting Helpers
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function renderStars(rating) {
    let starsHtml = '';
    const rounded = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
        if (i <= rounded) {
            starsHtml += '<i class="fa-solid fa-star"></i>';
        } else {
            starsHtml += '<i class="fa-regular fa-star"></i>';
        }
    }
    return starsHtml;
}

// Fetch Detailed Data
async function loadProductDetails() {
    if (!productId) {
        detailLayout.innerHTML = `<div class="error-msg">Không tìm thấy mã sản phẩm. <a href="/">Quay lại trang chủ</a></div>`;
        return;
    }

    try {
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();

        if (data.success) {
            product = data.product;
            reviews = data.reviews;
            rentals = data.rentals;
            currentSelectedImage = product.image_url;
            
            // Check favorites via backend API
            const favRes = await apiFetch(`/api/favorites/check/${product.id}`);
            isFavorited = favRes.success && favRes.favorited;

            renderDetails();
            renderReviews();
            renderRelated(data.related);
            attachPriceListeners();
        } else {
            detailLayout.innerHTML = `<div class="error-msg">Không thể tải thông tin sản phẩm: ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Error fetching details:', error);
        detailLayout.innerHTML = `<div class="error-msg">Lỗi hệ thống khi tải chi tiết sản phẩm.</div>`;
    }
}

// Render Main Product Info & Booking Section
function renderDetails() {
    const isOutOfStock = product.stock_quantity <= 0;
    
    // Create standard tech options
    const colors = ['Xám Không Gian (Space Gray)', 'Bạc (Silver)', 'Vàng (Gold)', 'Đen Huyền Bí (Matte Black)'];
    const capacities = product.category_id === 1 ? ['128GB', '256GB', '512GB'] : (product.category_id === 2 ? ['256GB', '512GB', '1TB'] : ['Chỉ Body', 'Combo Kèm Lens 18-55mm', 'Combo Kèm Lens 24-70mm']);

    const colorOptions = colors.map(c => `<option value="${c}">${c}</option>`).join('');
    const capacityOptions = capacities.map(cap => `<option value="${cap}">${cap}</option>`).join('');

    // Pre-calculate minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];

    // Secondary Gallery Thumbnails list
    const galleryThumbnails = [
        product.image_url,
        'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60'
    ];

    const thumbnailHtml = galleryThumbnails.map((imgUrl, index) => `
        <div class="thumbnail-item ${index === 0 ? 'active' : ''}" onclick="changeGalleryImage(this, '${imgUrl}')">
            <img src="${imgUrl}" alt="Gallery ${index + 1}">
        </div>
    `).join('');

    detailLayout.innerHTML = `
        <!-- Left Column: Gallery -->
        <div class="gallery-wrapper">
            <div class="gallery-box">
                <button class="favorite-toggle-btn ${isFavorited ? 'favorited' : ''}" id="fav-btn" onclick="toggleFavorite()">
                    <i class="fa-solid fa-heart"></i>
                </button>
                <img id="main-product-image" src="${currentSelectedImage}" alt="${product.name}">
            </div>
            <!-- Thumbnails List -->
            <div class="thumbnail-list">
                ${thumbnailHtml}
            </div>
        </div>

        <!-- Right Column: Product Meta & Options -->
        <div class="product-meta">
            <span class="badge" style="background-color: #059669;">Dùng Thử Trước Khi Mua</span>
            <h1>${product.name}</h1>
            
            <div class="rating-summary">
                <div class="stars">${renderStars(calculateAverageRating())}</div>
                <a href="#reviews-list-container" style="color: var(--text-muted); font-weight: 500;">
                    (${reviews.length} đánh giá từ người dùng)
                </a>
            </div>

            <!-- Price box emphasizing Rental Price first -->
            <div class="price-box">
                <div class="price-box-title">Giá Thuê Thiết Bị</div>
                <div class="rental-price-large" id="rental-price-display">
                    ${formatCurrency(product.trial_price_per_day)} <span style="font-size:14px;">/ ngày dùng thử</span>
                </div>
                
                <div class="buy-price-small">
                    <span>Giá mua đứt:</span>
                    <span class="buy-price-value" id="buy-price-display">${formatCurrency(product.price)}</span>
                    ${product.original_price ? `<span class="original-price" id="original-price-display" style="margin-left: 5px;">${formatCurrency(product.original_price)}</span>` : ''}
                </div>
            </div>

            <div class="product-selection-form">
                <!-- Color Selector -->
                <div class="option-group">
                    <label class="option-label">Chọn Màu Sắc:</label>
                    <select class="option-select" id="selected-color">
                        ${colorOptions}
                    </select>
                </div>

                <!-- Storage / Lens Selector -->
                <div class="option-group">
                    <label class="option-label">${product.category_id === 3 ? 'Cấu Hình Ống Kính:' : 'Chọn Dung Lượng:'}</label>
                    <select class="option-select" id="selected-capacity">
                        ${capacityOptions}
                    </select>
                </div>

                <!-- Quantity Selector -->
                <div class="option-group">
                    <label class="option-label">Số Lượng:</label>
                    <select class="option-select" id="selected-qty" style="width: 100px;">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </div>

                <!-- Booking Calendar for Rental Selection -->
                <div class="booking-calendar-box">
                    <label class="option-label" style="color: #047857;"><i class="fa-regular fa-calendar-days"></i> Đăng Ký Ngày Thuê Dùng Thử:</label>
                    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
                        Chỉ hiển thị các ngày thiết bị còn trống trong kho (chưa có lịch hẹn trước).
                    </p>
                    <div class="calendar-inputs">
                        <div class="calendar-input-group">
                            <label>Ngày bắt đầu:</label>
                            <input type="date" id="rent-start-date" min="${minDateStr}">
                        </div>
                        <div class="calendar-input-group">
                            <label>Ngày kết thúc:</label>
                            <input type="date" id="rent-end-date" min="${minDateStr}">
                        </div>
                    </div>
                    
                    <div id="booking-validation-msg" style="margin-top: 8px;"></div>
                    
                    ${renderSeededBlockedDates()}
                </div>
            </div>

            <div class="detail-actions">
                <button class="btn btn-primary btn-try-prominent btn-block" onclick="handleDetailAction('trial')" ${isOutOfStock ? 'disabled' : ''}>
                    <i class="fa-solid fa-rotate"></i> ${isOutOfStock ? 'Hết hàng trong kho' : 'Đăng Ký Thuê Dùng Thử Ngay'}
                </button>
                <button class="btn btn-outline btn-block" onclick="handleDetailAction('buy')" ${isOutOfStock ? 'disabled' : ''}>
                    <i class="fa-solid fa-cart-shopping"></i> Mua Đứt Sản Phẩm
                </button>
            </div>
        </div>
    `;
}

// Gallery Image Switcher
window.changeGalleryImage = function(element, imageUrl) {
    document.getElementById('main-product-image').src = imageUrl;
    currentSelectedImage = imageUrl;
    
    // Toggle active border class
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    thumbnails.forEach(t => t.classList.remove('active'));
    element.classList.add('active');
};

// Calculate and Update displayed prices in UI dynamically
function updatePrices() {
    if (!product) return;

    const capacitySelect = document.getElementById('selected-capacity');
    const qtySelect = document.getElementById('selected-qty');
    const startInput = document.getElementById('rent-start-date');
    const endInput = document.getElementById('rent-end-date');

    const selectedCapacityIdx = capacitySelect.selectedIndex;
    const qty = parseInt(qtySelect.value);

    // Pricing multiplier rules:
    // Option 0: base price
    // Option 1: +10%
    // Option 2: +20%
    let multiplier = 1.0;
    if (selectedCapacityIdx === 1) multiplier = 1.1;
    if (selectedCapacityIdx === 2) multiplier = 1.2;

    const baseTrialPrice = product.trial_price_per_day * multiplier;
    const baseBuyPrice = product.price * multiplier;

    // Check if valid dates are selected to multiply rental duration
    const startDate = startInput.value;
    const endDate = endInput.value;
    let daysCount = 1;
    let isRentingPriceTotal = false;

    if (startDate && endDate && startDate <= endDate) {
        // Validate overlaps
        const overlap = rentals.some(r => startDate <= r.end_date && endDate >= r.start_date);
        if (!overlap) {
            const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
            daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            isRentingPriceTotal = true;
        }
    }

    // Update displays
    const rentalDisplay = document.getElementById('rental-price-display');
    const buyDisplay = document.getElementById('buy-price-display');
    const originalPriceDisplay = document.getElementById('original-price-display');

    if (isRentingPriceTotal) {
        const totalRentalPrice = baseTrialPrice * daysCount * qty;
        rentalDisplay.innerHTML = `${formatCurrency(totalRentalPrice)} <span style="font-size:14px;">/ tổng ${daysCount} ngày (${qty} máy)</span>`;
    } else {
        const totalDailyPrice = baseTrialPrice * qty;
        rentalDisplay.innerHTML = `${formatCurrency(totalDailyPrice)} <span style="font-size:14px;">/ ngày (${qty} máy)</span>`;
    }

    buyDisplay.textContent = formatCurrency(baseBuyPrice * qty);
    if (originalPriceDisplay && product.original_price) {
        originalPriceDisplay.textContent = formatCurrency(product.original_price * multiplier * qty);
    }
}

// Attach change event listeners to options selectors
function attachPriceListeners() {
    const capacitySelect = document.getElementById('selected-capacity');
    const qtySelect = document.getElementById('selected-qty');
    const startInput = document.getElementById('rent-start-date');
    const endInput = document.getElementById('rent-end-date');

    if (capacitySelect) capacitySelect.addEventListener('change', updatePrices);
    if (qtySelect) qtySelect.addEventListener('change', updatePrices);
    
    if (startInput) {
        startInput.addEventListener('change', () => {
            validateRentalDates();
            updatePrices();
        });
    }
    
    if (endInput) {
        endInput.addEventListener('change', () => {
            validateRentalDates();
            updatePrices();
        });
    }
}

// Generate human readable blocked dates info
function renderSeededBlockedDates() {
    if (rentals.length === 0) return '';
    
    const datesLi = rentals.map(r => `<strong>${r.start_date}</strong> đến <strong>${r.end_date}</strong>`).join(', ');
    return `
        <div class="blocked-dates-info" style="color: #dc2626; border-top: 1px solid rgba(239, 68, 68, 0.1); padding-top: 10px; margin-top: 15px;">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Đã có người thuê trong khoảng: ${datesLi}. Vui lòng tránh các ngày này.</span>
        </div>
    `;
}

// Validate Datepicker selection against booked ranges
function validateRentalDates() {
    const startInput = document.getElementById('rent-start-date');
    const endInput = document.getElementById('rent-end-date');
    const msgDiv = document.getElementById('booking-validation-msg');
    
    const startDate = startInput.value;
    const endDate = endInput.value;

    if (!startDate || !endDate) {
        msgDiv.innerHTML = '';
        return true;
    }

    if (startDate > endDate) {
        msgDiv.innerHTML = `<span style="color:#ef4444; font-size:12px; font-weight:600;"><i class="fa-solid fa-circle-xmark"></i> Ngày kết thúc phải sau ngày bắt đầu!</span>`;
        return false;
    }

    // Check overlap with booked dates
    const overlap = rentals.some(r => {
        return (startDate <= r.end_date && endDate >= r.start_date);
    });

    if (overlap) {
        msgDiv.innerHTML = `<span style="color:#ef4444; font-size:12px; font-weight:600;"><i class="fa-solid fa-circle-xmark"></i> Trùng lịch! Khoảng ngày này thiết bị đã được thuê. Vui lòng chọn ngày khác.</span>`;
        return false;
    }

    // Calculate rental days
    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    msgDiv.innerHTML = `<span style="color:#059669; font-size:12px; font-weight:600;"><i class="fa-solid fa-circle-check"></i> Thiết bị sẵn sàng! Tổng số ngày thuê: ${diffDays} ngày.</span>`;
    return true;
}

// Handle Add to Cart from Detail Screen
function handleDetailAction(actionType) {
    if (product.stock_quantity <= 0) {
        alert('Sản phẩm đã hết hàng!');
        return;
    }

    const color = document.getElementById('selected-color').value;
    const capacity = document.getElementById('selected-capacity').value;
    const qty = parseInt(document.getElementById('selected-qty').value);
    const capacitySelect = document.getElementById('selected-capacity');
    
    const selectedCapacityIdx = capacitySelect.selectedIndex;
    let multiplier = 1.0;
    if (selectedCapacityIdx === 1) multiplier = 1.1;
    if (selectedCapacityIdx === 2) multiplier = 1.2;

    let price = product.price * multiplier;
    let title = `${product.name} (${color}, ${capacity})`;
    let typeLabel = 'Mua đứt';

    if (actionType === 'trial') {
        const startInput = document.getElementById('rent-start-date');
        const endInput = document.getElementById('rent-end-date');
        
        if (!startInput.value || !endInput.value) {
            alert('Vui lòng chọn ngày bắt đầu và kết thúc thuê!');
            return;
        }

        if (!validateRentalDates()) {
            alert('Lịch chọn không hợp lệ hoặc đã bị trùng!');
            return;
        }

        // Calculate days
        const diffTime = Math.abs(new Date(endInput.value) - new Date(startInput.value));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        price = product.trial_price_per_day * multiplier * diffDays;
        title = `Thuê ${product.name} (${color}, ${capacity}) - ${diffDays} ngày [Từ ${startInput.value} đến ${endInput.value}]`;
        typeLabel = 'Dùng thử';
    }

    // Add to cart state
    const cartItem = {
        uniqueId: Date.now() + Math.random().toString(36).substr(2, 9),
        id: product.id,
        name: title,
        price: price * qty,
        image: currentSelectedImage,
        type: typeLabel
    };

    cart.push(cartItem);
    saveCart();
    updateCartUI();
    openCart();
}

// Favorites Toggle
async function toggleFavorite() {
    const favBtn = document.getElementById('fav-btn');
    try {
        const res = await apiFetch('/api/favorites/toggle', {
            method: 'POST',
            body: JSON.stringify({ productId: product.id })
        });
        if (res.success) {
            isFavorited = res.favorited;
            if (isFavorited) {
                favBtn.classList.add('favorited');
            } else {
                favBtn.classList.remove('favorited');
            }
        }
    } catch (e) {
        console.error('Error toggling favorite:', e);
    }
}

// Calculate Rating Stats
function calculateAverageRating() {
    if (reviews.length === 0) return 5.0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
}

// Render Reviews
function renderReviews() {
    if (reviews.length === 0) {
        reviewsListContainer.innerHTML = '<p class="text-muted">Chưa có đánh giá nào cho sản phẩm này.</p>';
        avgRatingVal.textContent = '5.0';
        avgStarsContainer.innerHTML = renderStars(5);
        reviewsCountLabel.textContent = '0 đánh giá';
        return;
    }

    const avg = calculateAverageRating();
    avgRatingVal.textContent = avg;
    avgStarsContainer.innerHTML = renderStars(avg);
    reviewsCountLabel.textContent = `${reviews.length} đánh giá từ người dùng`;

    reviewsListContainer.innerHTML = '';
    reviews.forEach(r => {
        const dateStr = new Date(r.created_at).toLocaleDateString('vi-VN');
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <div class="review-user-info">
                <span class="review-username">${r.user_name}</span>
                <span class="review-date">${dateStr}</span>
            </div>
            <div class="stars" style="margin-bottom: 8px;">
                ${renderStars(r.rating)}
            </div>
            <p class="review-comment">${r.comment || 'Không có nhận xét bằng lời.'}</p>
        `;
        reviewsListContainer.appendChild(card);
    });
}

// Render Related Products Carousel
function renderRelated(productsList) {
    relatedContainer.innerHTML = '';
    
    if (productsList.length === 0) {
        relatedContainer.innerHTML = '<p class="text-muted">Không tìm thấy sản phẩm liên quan nào.</p>';
        return;
    }

    productsList.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-container">
                <span class="trial-badge">Thuê thử</span>
                <img src="${prod.image_url}" alt="${prod.name}">
            </div>
            <div class="product-info">
                <h4 class="product-name">${prod.name}</h4>
                <div class="product-pricing">
                    <div class="trial-price-row" style="font-size: 15px; font-weight:800; color: #059669;">
                        ${formatCurrency(prod.trial_price_per_day)} <span style="font-size: 11px; font-weight:500; color: var(--text-muted);">/ ngày</span>
                    </div>
                </div>
                <div class="product-actions" style="margin-top: 10px;">
                    <a href="product.html?id=${prod.id}" class="btn btn-primary" style="background-color: #059669; width: 100%; text-align: center;">
                        Xem Chi Tiết
                    </a>
                </div>
            </div>
        `;
        relatedContainer.appendChild(card);
    });

    // Wire scroll navigation
    document.getElementById('related-prev').addEventListener('click', () => {
        relatedContainer.scrollBy({ left: -300, behavior: 'smooth' });
    });
    document.getElementById('related-next').addEventListener('click', () => {
        relatedContainer.scrollBy({ left: 300, behavior: 'smooth' });
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadProductDetails();
});
