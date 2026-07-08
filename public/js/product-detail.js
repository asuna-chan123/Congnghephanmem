// State variables
let product = null;
let reviews = [];
let rentals = [];
let isFavorited = false;
let currentSelectedImage = '';
let activeColor = '';
let activeCapacity = '';
let activeQty = 1;

const colorMap = {
    'Đen': '#1d1d1f',
    'Bạc': '#e3e4e5',
    'Xám': '#5f6062',
    'Vàng': '#f4e0c8',
    'Hồng': '#fae0e4',
    'Xanh': '#a7c7e7',
    'Trắng': '#fbfbfd',
    'Titan tự nhiên': '#aba69f',
    'Titan sa mạc': '#c2b29f',
    'Titan trắng': '#f2f1ed',
    'Titan đen': '#232426'
};
function getColorHex(colorName) {
    return colorMap[colorName] || '#8e8e93';
}

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

function formatDateString(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateStr;
    }
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

            // Normalize product.images to always be an array of objects { url, color, isPrimary }
            if (product.images) {
                product.images = product.images.map(img => {
                    if (typeof img === 'string') {
                        return { url: img, color: null, isPrimary: false };
                    }
                    return img;
                });
            }

            currentSelectedImage = product.image_url;

            // Check favorites via backend API
            const favRes = await apiFetch(`/api/favorites/check/${product.id}`);
            isFavorited = favRes.success && favRes.favorited;

            renderDetails();
            const colorSelect = document.getElementById('selected-color');
            if (colorSelect) {
                updateGalleryForColor(colorSelect.value);
            }
            renderReviews();
            renderRelated(data.related);
            attachPriceListeners();
            updatePrices();
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
    const capacities = product.variants && product.variants.length > 0
        ? [...new Set(product.variants.map(v => v.capacity).filter(Boolean))]
        : ['Tiêu chuẩn'];

    // Set initial active state if not already set
    if (!activeCapacity) activeCapacity = capacities[0];

    // Filter variants by the currently active capacity to find available colors
    const activeVariants = product.variants && product.variants.length > 0
        ? product.variants.filter(v => v.capacity === activeCapacity)
        : [];
    const colors = [...new Set(activeVariants.map(v => v.color).filter(Boolean))];
    if (colors.length === 0) colors.push('Đen');

    // Auto-select a color that has stock > 0 for this capacity, if available
    const inStockColors = activeVariants.filter(v => v.stock_quantity > 0).map(v => v.color);
    if (inStockColors.length > 0 && (!activeColor || !inStockColors.includes(activeColor))) {
        activeColor = inStockColors[0];
    } else if (!activeColor || !colors.includes(activeColor)) {
        activeColor = colors[0];
    }

    // Pre-calculate minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = tomorrow.toISOString().split('T')[0];

    // Secondary Gallery Thumbnails list
    const galleryThumbnails = product.images && product.images.length > 0 ? product.images : [{ url: product.image_url, color: null, isPrimary: true }];

    const thumbnailHtml = galleryThumbnails.map((img, index) => `
        <div class="thumbnail-item ${index === 0 ? 'active' : ''}" onclick="changeGalleryImage(this, '${img.url}')">
            <img src="${img.url}" alt="Gallery ${index + 1}">
        </div>
    `).join('');

    // Highlight specs for Huawei style Model Card
    let modelHighlights = [
        "Thiết kế tinh tế mang tính biểu tượng",
        "Hiệu năng tối ưu đáp ứng mọi nhu cầu làm việc",
        "Chất lượng hoàn thiện cực kỳ cao cấp"
    ];
    if (product.name.toLowerCase().includes('macbook')) {
        modelHighlights = [
            "Chip Apple Silicon hiệu năng đột phá",
            "Màn hình Liquid Retina hiển thị siêu sắc nét",
            "Thời lượng pin lên đến 18 tiếng sử dụng liên tục"
        ];
    } else if (product.name.toLowerCase().includes('iphone')) {
        modelHighlights = [
            "Camera Pro chụp ảnh thiếu sáng đỉnh cao",
            "Khung viền Titan siêu nhẹ và bền bỉ",
            "Chip A-Series xử lý tác vụ thông minh mượt mà"
        ];
    } else if (product.name.toLowerCase().includes('ipad')) {
        modelHighlights = [
            "Màn hình Liquid Retina hỗ trợ Apple Pencil",
            "Thiết kế siêu mỏng nhẹ, tối ưu di động",
            "Hệ điều hành iPadOS trực quan, đa nhiệm linh hoạt"
        ];
    }

    const highlightsHtml = modelHighlights.map(h => `<li>${h}</li>`).join('');

    // Create a database color code mapping
    const colorMapDb = {};
    if (product.variants) {
        product.variants.forEach(v => {
            if (v.color && v.hex) {
                colorMapDb[v.color] = v.hex;
            }
        });
    }

    // Color swatches rendering
    const colorSwatchesHtml = colors.map((c) => {
        const hex = colorMapDb[c] || getColorHex(c);
        const isActive = c === activeColor;
        const colorVar = activeVariants.find(v => v.color === c);
        const isOutOfStock = !colorVar || colorVar.stock_quantity <= 0;
        return `
            <div class="color-swatch-wrapper ${isActive ? 'active' : ''} ${isOutOfStock ? 'disabled' : ''}" 
                 data-color="${c}" 
                 onclick="${isOutOfStock ? '' : `selectColorSwatch(this, '${c}')`}">
                <div class="color-swatch-circle" style="background-color: ${hex};"></div>
                <span class="color-swatch-label">${c}</span>
            </div>
        `;
    }).join('');

    // Capacity cards rendering
    const capacityCardsHtml = capacities.map((cap) => {
        const isActive = cap === activeCapacity;
        // Find variant for price display
        let variant = product.variants.find(v => v.color === activeColor && v.capacity === cap);
        if (!variant) variant = product.variants.find(v => v.capacity === cap) || product.variants[0];

        // Disable capacity card if all variants of this capacity are out of stock
        const hasStock = product.variants.some(v => v.capacity === cap && v.stock_quantity > 0);
        const isOutOfStock = !hasStock;

        const priceVal = variant ? variant.price : product.price;
        const trialPriceVal = variant ? variant.trial_price_per_day : product.trial_price_per_day;

        return `
            <div class="capacity-card ${isActive ? 'active' : ''} ${isOutOfStock ? 'disabled' : ''}" 
                 data-capacity="${cap}" 
                 onclick="${isOutOfStock ? '' : `selectCapacityCard(this, '${cap}')`}" 
                 style="flex-direction: column; align-items: flex-start; gap: 4px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <span class="capacity-name" style="font-weight: 600;">${cap}</span>
                    <span class="capacity-price" style="font-weight: 700;">${formatCurrency(priceVal)} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">(Mua đứt)</span></span>
                </div>
                <div style="font-size: 12px; color: var(--accent); font-weight: 600;">
                    Thuê: ${formatCurrency(trialPriceVal)} / ngày
                </div>
            </div>
        `;
    }).join('');

    detailLayout.innerHTML = `
        <!-- Left Column: Gallery & Description Accordion -->
        <div class="gallery-wrapper">
            <div class="gallery-box">
                <button class="favorite-toggle-btn ${isFavorited ? 'favorited' : ''}" id="fav-btn" onclick="toggleFavorite()">
                    <i class="fa-solid fa-heart"></i>
                </button>
                <img id="main-product-image" src="${currentSelectedImage}" alt="${product.name}">
            </div>
            <!-- Thumbnails List -->
            <div class="thumbnail-list" id="thumbnail-list-container">
                ${thumbnailHtml}
            </div>

            <!-- Huawei-style Collapsible Description Box -->
            <div class="collapsible-description-box">
                <div class="collapsible-description-header" onclick="toggleDescription()">
                    <h3>Mô tả sản phẩm</h3>
                    <i class="fa-solid fa-chevron-down toggle-icon" id="desc-chevron"></i>
                </div>
                <div class="collapsible-description-body" id="desc-body">
                    <div class="collapsible-description-text">
                        ${product.description || 'Thông tin mô tả sản phẩm đang được cập nhật.'}
                    </div>
                    <div class="description-overlay" id="desc-overlay"></div>
                </div>
                <div class="collapsible-description-footer">
                    <button class="btn-toggle-description" id="desc-toggle-btn" onclick="toggleDescription()">
                        <span>Xem thêm</span> <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Right Column: Product Meta & Options -->
        <div class="product-meta">
            <!-- Huawei-style Navigation Tabs -->
            <div class="huawei-product-nav-tabs">
                <span class="huawei-tab-item active">Tổng quan</span>
                <span class="huawei-tab-divider">|</span>
                <a href="#reviews-list-container" class="huawei-tab-item">Đánh giá</a>
                <span class="huawei-tab-divider">|</span>
                <span class="huawei-tab-item" onclick="document.querySelector('.collapsible-description-box').scrollIntoView({behavior: 'smooth'})">Chi tiết</span>
            </div>

            <span class="badge" style="background-color: white;">Dùng Thử Trước Khi Mua</span>
            <h1 style="margin-top: 8px;">${product.name}</h1>
            
            <div class="rating-summary" style="margin-bottom: 15px;">
                <div class="stars">${renderStars(calculateAverageRating())}</div>
                <a href="#reviews-list-container" style="color: var(--text-secondary); font-weight: 500;">
                    (${reviews.length} đánh giá từ người dùng)
                </a>
            </div>

            <!-- Huawei Model Card with highlights -->
            <div class="huawei-model-card">
                <div class="huawei-model-card-title">Điểm nổi bật của sản phẩm</div>
                <ul class="huawei-model-card-features">
                    ${highlightsHtml}
                </ul>
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
                <!-- Color Swatches Selector -->
                <div class="option-group">
                    <label class="option-label">Màu Sắc:</label>
                    <div class="color-swatches" id="color-swatches-container">
                        ${colorSwatchesHtml}
                    </div>
                </div>

                <!-- Storage / Lens Selector Cards -->
                <div class="option-group">
                    <label class="option-label">${product.category_id === 3 ? 'Cấu Hình Ống Kính:' : 'Cấu Hình Bộ Nhớ:'}</label>
                    <div class="capacity-grid" id="capacity-cards-container">
                        ${capacityCardsHtml}
                    </div>
                </div>

                <!-- Quantity Stepper Selector -->
                <div class="option-group">
                    <label class="option-label">Số Lượng:</label>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="quantity-stepper">
                            <button class="stepper-btn" onclick="adjustQty(-1)"><i class="fa-solid fa-minus"></i></button>
                            <input type="text" class="stepper-val" id="stepper-quantity" value="1" readonly>
                            <button class="stepper-btn" onclick="adjustQty(1)"><i class="fa-solid fa-plus"></i></button>
                        </div>
                        <span class="stock-hint" id="stock-qty-display" style="font-size: 13px; color: var(--text-secondary); font-weight: 500;"></span>
                    </div>
                </div>

                <!-- Booking Calendar for Rental Selection -->
                <div class="booking-calendar-box">
                    <label class="option-label" style="color: var(--accent); margin-bottom: 5px;"><i class="fa-regular fa-calendar-days"></i> Đăng Ký Ngày Thuê Dùng Thử:</label>
                    <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
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
                    <i class="fa-solid fa-rotate"></i> ${isOutOfStock ? 'Hết hàng trong kho' : 'Thuê Dùng Thử'}
                </button>
                <button class="btn btn-outline btn-block" onclick="handleDetailAction('buy')" ${isOutOfStock ? 'disabled' : ''}>
                    <i class="fa-solid fa-cart-shopping"></i> Mua Đứt Sản Phẩm
                </button>
            </div>
        </div>
    `;
}

// Gallery Image Switcher
window.changeGalleryImage = function (element, imageUrl) {
    document.getElementById('main-product-image').src = imageUrl;
    currentSelectedImage = imageUrl;

    // Toggle active border class
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    thumbnails.forEach(t => t.classList.remove('active'));
    element.classList.add('active');
};

// Calculate and Update displayed prices in UI dynamically
function updatePrices() {
    if (!product || !product.variants || product.variants.length === 0) return;

    const startInput = document.getElementById('rent-start-date');
    const endInput = document.getElementById('rent-end-date');

    const selectedColor = activeColor;
    const selectedCapacity = activeCapacity;
    const qty = activeQty;

    // Tìm variant khớp với color và capacity đã chọn
    let variant = product.variants.find(v => v.color === selectedColor && v.capacity === selectedCapacity);
    if (!variant) {
        // Fallback sang variant đầu tiên
        variant = product.variants[0];
    }

    // Limit quantity selector dynamically based on database stock
    const maxQty = variant ? variant.stock_quantity : 5;
    if (activeQty > maxQty) {
        activeQty = maxQty;
        const stepperValEl = document.getElementById('stepper-quantity');
        if (stepperValEl) stepperValEl.value = activeQty;
    }

    const stockQtyDisplay = document.getElementById('stock-qty-display');
    if (stockQtyDisplay) {
        if (maxQty > 0) {
            stockQtyDisplay.textContent = `(Còn lại ${maxQty} sản phẩm trong kho)`;
            stockQtyDisplay.style.color = "var(--text-secondary)";
        } else {
            stockQtyDisplay.textContent = `(Hết hàng)`;
            stockQtyDisplay.style.color = "var(--danger)";
        }
    }

    const baseTrialPrice = parseFloat(variant.trial_price_per_day) || 0;
    const baseBuyPrice = parseFloat(variant.price) || 0;
    const originalPriceVal = baseBuyPrice * 1.15; // mock 15% discount for display

    // Check if valid dates are selected to multiply rental duration
    const startDate = startInput.value;
    const endDate = endInput.value;
    let daysCount = 1;
    let isRentingPriceTotal = false;

    if (startDate && endDate && startDate <= endDate) {
        // Validate overlaps
        const overlap = rentals.some(r => {
            const rStart = r.start_date ? r.start_date.substring(0, 10) : '';
            const rEnd = r.end_date ? r.end_date.substring(0, 10) : '';
            return startDate <= rEnd && endDate >= rStart;
        });
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
    if (originalPriceDisplay) {
        originalPriceDisplay.textContent = formatCurrency(originalPriceVal * qty);
    }
}

// Attach change event listeners to options selectors
function attachPriceListeners() {
    const startInput = document.getElementById('rent-start-date');
    const endInput = document.getElementById('rent-end-date');

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

// Callback functions for interactive selectors
window.selectColorSwatch = function (element, color) {
    document.querySelectorAll('.color-swatch-wrapper').forEach(w => w.classList.remove('active'));
    element.classList.add('active');
    activeColor = color;
    updateGalleryForColor(color);
    updateCapacityPrices();
    updatePrices();
};

window.selectCapacityCard = function (element, capacity) {
    document.querySelectorAll('.capacity-card').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    activeCapacity = capacity;
    updateColorSwatches();
    updatePrices();
};

function updateColorSwatches() {
    const swatchesContainer = document.getElementById('color-swatches-container');
    if (!swatchesContainer) return;
    
    const activeVariants = product.variants && product.variants.length > 0
        ? product.variants.filter(v => v.capacity === activeCapacity)
        : [];
    
    const colorMapDb = {};
    activeVariants.forEach(v => {
        if (v.color && v.hex) {
            colorMapDb[v.color] = v.hex;
        }
    });

    const colors = [...new Set(activeVariants.map(v => v.color).filter(Boolean))];
    if (colors.length === 0) colors.push('Đen');

    // Auto-select a color that has stock > 0 for this capacity, if available
    const inStockColors = activeVariants.filter(v => v.stock_quantity > 0).map(v => v.color);
    if (inStockColors.length > 0 && (!activeColor || !inStockColors.includes(activeColor))) {
        activeColor = inStockColors[0];
        updateGalleryForColor(activeColor);
    } else if (!colors.includes(activeColor)) {
        activeColor = colors[0];
        updateGalleryForColor(activeColor);
    }

    swatchesContainer.innerHTML = colors.map((c) => {
        const hex = colorMapDb[c] || getColorHex(c);
        const isActive = c === activeColor;
        const colorVar = activeVariants.find(v => v.color === c);
        const isOutOfStock = !colorVar || colorVar.stock_quantity <= 0;
        return `
            <div class="color-swatch-wrapper ${isActive ? 'active' : ''} ${isOutOfStock ? 'disabled' : ''}" 
                 data-color="${c}" 
                 onclick="${isOutOfStock ? '' : `selectColorSwatch(this, '${c}')`}">
                <div class="color-swatch-circle" style="background-color: ${hex};"></div>
                <span class="color-swatch-label">${c}</span>
            </div>
        `;
    }).join('');
}

window.adjustQty = function (change) {
    const stepperValEl = document.getElementById('stepper-quantity');
    if (!stepperValEl) return;
    let currentVal = parseInt(stepperValEl.value, 10) || 1;

    // Find active variant to check stock limit
    let variant = product.variants.find(v => v.color === activeColor && v.capacity === activeCapacity);
    if (!variant) variant = product.variants.find(v => v.capacity === activeCapacity) || product.variants[0];
    const maxQty = variant ? variant.stock_quantity : 5;

    let newVal = currentVal + change;
    if (newVal < 1) return;
    if (newVal > maxQty) {
        alert(`Rất tiếc, kho hàng chỉ còn lại ${maxQty} sản phẩm này.`);
        return;
    }

    stepperValEl.value = newVal;
    activeQty = newVal;
    updatePrices();
};

window.toggleDescription = function () {
    const body = document.getElementById('desc-body');
    const chevron = document.getElementById('desc-chevron');
    const btn = document.getElementById('desc-toggle-btn');
    const overlay = document.getElementById('desc-overlay');
    if (!body || !btn) return;

    if (body.classList.contains('expanded')) {
        body.classList.remove('expanded');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        btn.innerHTML = `<span>Xem thêm</span> <i class="fa-solid fa-chevron-down"></i>`;
        if (overlay) overlay.style.opacity = '1';
    } else {
        body.classList.add('expanded');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
        btn.innerHTML = `<span>Thu gọn</span> <i class="fa-solid fa-chevron-up"></i>`;
        if (overlay) overlay.style.opacity = '0';
    }
};

function updateCapacityPrices() {
    const capacities = product.variants && product.variants.length > 0
        ? [...new Set(product.variants.map(v => v.capacity).filter(Boolean))]
        : ['Tiêu chuẩn'];

    const container = document.getElementById('capacity-cards-container');
    if (!container) return;

    container.innerHTML = capacities.map((cap) => {
        const isActive = cap === activeCapacity;
        let variant = product.variants.find(v => v.color === activeColor && v.capacity === cap);
        if (!variant) variant = product.variants.find(v => v.capacity === cap) || product.variants[0];

        // Disable capacity card if all variants of this capacity are out of stock
        const hasStock = product.variants.some(v => v.capacity === cap && v.stock_quantity > 0);
        const isOutOfStock = !hasStock;

        const priceVal = variant ? variant.price : product.price;
        const trialPriceVal = variant ? variant.trial_price_per_day : product.trial_price_per_day;

        return `
            <div class="capacity-card ${isActive ? 'active' : ''} ${isOutOfStock ? 'disabled' : ''}" 
                 data-capacity="${cap}" 
                 onclick="${isOutOfStock ? '' : `selectCapacityCard(this, '${cap}')`}" 
                 style="flex-direction: column; align-items: flex-start; gap: 4px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <span class="capacity-name" style="font-weight: 600;">${cap}</span>
                    <span class="capacity-price" style="font-weight: 700;">${formatCurrency(priceVal)} <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary);">(Mua đứt)</span></span>
                </div>
                <div style="font-size: 12px; color: var(--accent); font-weight: 600;">
                    Thuê: ${formatCurrency(trialPriceVal)} / ngày
                </div>
            </div>
        `;
    }).join('');
}

// Cập nhật danh sách ảnh và ảnh chính dựa trên màu được chọn
function updateGalleryForColor(color) {
    if (!product || !product.images || product.images.length === 0) return;

    // Lọc ảnh có cùng màu hoặc các ảnh chung (không có màu)
    let filteredImages = product.images.filter(img => img.color === color || !img.color);

    if (filteredImages.length === 0) {
        filteredImages = product.images;
    }

    const container = document.getElementById('thumbnail-list-container');
    const mainImg = document.getElementById('main-product-image');

    if (container) {
        container.innerHTML = filteredImages.map((img, index) => `
            <div class="thumbnail-item ${index === 0 ? 'active' : ''}" onclick="changeGalleryImage(this, '${img.url}')">
                <img src="${img.url}" alt="Gallery ${index + 1}">
            </div>
        `).join('');
    }

    // Thiết lập ảnh đại diện chính của màu đó
    const primaryImg = filteredImages.find(img => img.isPrimary) || filteredImages[0];
    if (mainImg && primaryImg) {
        mainImg.src = primaryImg.url;
        currentSelectedImage = primaryImg.url;
    }
}

// Generate human readable blocked dates info
function renderSeededBlockedDates() {
    if (rentals.length === 0) return '';

    const datesLi = rentals.map(r => {
        const formattedStart = formatDateString(r.start_date);
        const formattedEnd = formatDateString(r.end_date);
        return `<strong>${formattedStart}</strong> đến <strong>${formattedEnd}</strong>`;
    }).join(', ');
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
        const rStart = r.start_date ? r.start_date.substring(0, 10) : '';
        const rEnd = r.end_date ? r.end_date.substring(0, 10) : '';
        return (startDate <= rEnd && endDate >= rStart);
    });

    if (overlap) {
        msgDiv.innerHTML = `<span style="color:#ef4444; font-size:12px; font-weight:600;"><i class="fa-solid fa-circle-xmark"></i> Trùng lịch! Khoảng ngày này thiết bị đã được thuê. Vui lòng chọn ngày khác.</span>`;
        return false;
    }

    // Calculate rental days
    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    msgDiv.innerHTML = `<span style="color:var(--accent); font-size:12px; font-weight:600;"><i class="fa-solid fa-circle-check"></i> Thiết bị sẵn sàng! Tổng số ngày thuê: ${diffDays} ngày.</span>`;
    return true;
}

// Handle Add to Cart from Detail Screen
async function handleDetailAction(actionType) {
    if (product.stock_quantity <= 0) {
        alert('Sản phẩm đã hết hàng!');
        return;
    }

    const type = actionType === 'trial' ? 'trial' : 'buy';
    const qty = activeQty;

    const selectedColor = activeColor;
    const selectedCapacity = activeCapacity;

    let variant = product.variants.find(v => v.color === selectedColor && v.capacity === selectedCapacity);
    if (!variant) {
        variant = product.variants[0];
    }

    if (type === 'trial') {
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
    }

    try {
        const res = await apiFetch('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({ variantId: variant.id, type, quantity: qty })
        });
        if (res.success) {
            showStatusPopup(true, 'Đã thêm vào giỏ hàng thành công.', true);
        } else {
            showStatusPopup(false, 'Bổ sung thất bại: ' + res.message);
        }
    } catch (e) {
        console.error('Error adding to cart:', e);
        showStatusPopup(false, 'Lỗi bổ sung vào giỏ hàng. Vui lòng thử lại sau.');
    }
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
