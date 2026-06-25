// State Management
let products = [];
let categories = [];
let cart = [];

// Filters State
let currentCategory = 'all'; // 'all', 'dien-thoai', 'laptop', 'may-anh'
let currentTag = null;
let selectedBrands = new Set();
let searchKeyword = '';
let showTrialOnly = false;
let showInStockOnly = false;
let currentSort = 'default';

// Category Cards Collapsible State
let showAllCategories = false;
const categoriesLimit = 3; // Number of category cards to show initially (including "All")

// Category UI configurations
const categoryMetadata = {
    'all': {
        title: 'Tất cả thiết bị công nghệ',
        desc: 'Khám phá và trải nghiệm các thiết bị công nghệ đỉnh cao trước khi quyết định sở hữu',
        image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=300&auto=format&fit=crop&q=80'
    },
    'dien-thoai': {
        title: 'Điện thoại thông minh',
        desc: 'Khám phá các dòng flagship đỉnh cao với camera sắc nét, hiệu năng mạnh mẽ và pin cực trâu',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&auto=format&fit=crop&q=80'
    },
    'laptop': {
        title: 'Máy tính xách tay & Laptop',
        desc: 'Laptop văn phòng mỏng nhẹ sang trọng, đồ họa chuyên nghiệp và gaming đỉnh cao',
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&auto=format&fit=crop&q=80'
    },
    'may-anh': {
        title: 'Máy ảnh & Thiết bị ghi hình',
        desc: 'Lưu giữ những khoảnh khắc tuyệt vời với máy ảnh chuyên nghiệp, vlog cam hay action cam bền bỉ',
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&auto=format&fit=crop&q=80'
    }
};

function getCategoryMeta(slug, name) {
    if (categoryMetadata[slug]) return categoryMetadata[slug];
    return {
        title: name || slug,
        desc: `Trải nghiệm các thiết bị thuộc danh mục ${name || slug}`,
        image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=300&auto=format&fit=crop&q=80'
    };
}

// Tag configurations matching homepage tags
const productCategoryTagLabels = {
    'dien-thoai': [
        { tag: 'gia-re', label: 'Giá rẻ' },
        { tag: 'chup-anh', label: 'Chụp ảnh đẹp' },
        { tag: 'hieu-nang', label: 'Hiệu năng cao' },
        { tag: 'pin-trau', label: 'Pin trâu' },
        { tag: 'mong-nhe', label: 'Mỏng nhẹ' }
    ],
    'laptop': [
        { tag: 'van-phong', label: 'Thiết bị văn phòng' },
        { tag: 'sang-trong', label: 'Sang trọng' },
        { tag: 'mong-nhe', label: 'Mỏng nhẹ' },
        { tag: 'do-hoa', label: 'Đồ họa' },
        { tag: 'choi-game', label: 'Chơi game' }
    ],
    'may-anh': [
        { tag: 'du-lich', label: 'Du lịch' },
        { tag: 'chuyen-nghiep', label: 'Chuyên nghiệp' },
        { tag: 'vlog', label: 'Vlog' },
        { tag: 'action-cam', label: 'Action Cam' },
        { tag: 'compact', label: 'Compact' }
    ]
};

// DOM Elements
const catalogGrid = document.getElementById('catalog-grid');
const catalogTitle = document.getElementById('catalog-title');
const resultsCountLabel = document.getElementById('catalog-results-count');
const sortSelect = document.getElementById('sort-select');
const tagsFilterGroup = document.getElementById('tags-filter-group');
const dynamicTagsList = document.getElementById('dynamic-tags-list');
const filterTrialOnly = document.getElementById('filter-trial-only');
const filterInStock = document.getElementById('filter-in-stock');
const activeFiltersRow = document.getElementById('active-filters-row');
const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');

// New Top Category DOM Elements
const categoryCardsGrid = document.getElementById('category-cards-grid');
const catHeroTitle = document.getElementById('cat-hero-title');
const catHeroDesc = document.getElementById('cat-hero-desc');
const showMoreCategoriesBtn = document.getElementById('show-more-categories-btn');
const showMoreWrapper = document.getElementById('show-more-wrapper');
const brandFilterList = document.getElementById('brand-filter-list');

function getHeaderSearchInput() {
    return document.getElementById('header-search-input');
}

// Helper to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

// Fetch all product data
async function fetchCatalogData() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success) {
            products = data.products;
            categories = data.categories;
            
            // Read query params
            parseQueryParams();
            
            // Setup events
            setupEventListeners();
            
            // Initial render
            renderAll();
        } else {
            catalogGrid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Lỗi tải sản phẩm</h3><p>${data.message}</p></div>`;
        }
    } catch (error) {
        console.error('Error fetching catalog:', error);
        catalogGrid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-wifi"></i><h3>Lỗi kết nối máy chủ</h3><p>Vui lòng thử lại sau.</p></div>`;
    }
}

// Parse Query Parameters
function parseQueryParams() {
    const params = new URLSearchParams(window.location.search);
    
    const catParam = params.get('category');
    if (catParam) {
        currentCategory = catParam;
    }
    
    const tagParam = params.get('tag');
    if (tagParam) {
        currentTag = tagParam;
    }
    
    const brandParam = params.get('brand');
    selectedBrands.clear();
    if (brandParam) {
        brandParam.split(',').forEach(b => selectedBrands.add(b.trim()));
    }
    
    const searchParam = params.get('search');
    if (searchParam) {
        searchKeyword = searchParam.trim();
        const input = getHeaderSearchInput();
        if (input) input.value = searchKeyword;
    }
}

// Listeners
function setupEventListeners() {
    // Show/Hide More Categories click handler
    if (showMoreCategoriesBtn) {
        showMoreCategoriesBtn.addEventListener('click', () => {
            showAllCategories = !showAllCategories;
            renderCategoryCards();
        });
    }

    // Checkboxes
    filterTrialOnly.addEventListener('change', (e) => {
        showTrialOnly = e.target.checked;
        renderAll();
    });

    filterInStock.addEventListener('change', (e) => {
        showInStockOnly = e.target.checked;
        renderAll();
    });

    // Sort select
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderAll();
    });

    // Clear filters button
    clearAllFiltersBtn.addEventListener('click', () => {
        currentCategory = 'all';
        currentTag = null;
        selectedBrands.clear();
        searchKeyword = '';
        showTrialOnly = false;
        showInStockOnly = false;
        currentSort = 'default';
        
        const input = getHeaderSearchInput();
        if (input) input.value = '';
        filterTrialOnly.checked = false;
        filterInStock.checked = false;
        sortSelect.value = 'default';
        
        updateUrlParams();
        renderAll();
    });

    // Header search input change
    const input = getHeaderSearchInput();
    if (input) {
        input.addEventListener('input', (e) => {
            searchKeyword = e.target.value.trim();
            renderAll();
        });
    }
}

// Update URL parameters without reload
function updateUrlParams() {
    const url = new URL(window.location);
    if (currentCategory && currentCategory !== 'all') {
        url.searchParams.set('category', currentCategory);
    } else {
        url.searchParams.delete('category');
    }
    
    if (currentTag) {
        url.searchParams.set('tag', currentTag);
    } else {
        url.searchParams.delete('tag');
    }
    
    if (selectedBrands.size > 0) {
        url.searchParams.set('brand', Array.from(selectedBrands).join(','));
    } else {
        url.searchParams.delete('brand');
    }
    
    if (searchKeyword) {
        url.searchParams.set('search', searchKeyword);
    } else {
        url.searchParams.delete('search');
    }
    
    window.history.pushState({}, '', url);
}

// Render dynamic category cards at the top
function renderCategoryCards() {
    if (!categoryCardsGrid) return;
    categoryCardsGrid.innerHTML = '';
    
    const allCategoriesList = [
        { id: 'all', name: 'Tất cả thiết bị', slug: 'all' },
        ...categories
    ];
    
    const visibleCount = showAllCategories ? allCategoriesList.length : Math.min(categoriesLimit, allCategoriesList.length);
    
    for (let i = 0; i < visibleCount; i++) {
        const cat = allCategoriesList[i];
        const meta = getCategoryMeta(cat.slug, cat.name);
        
        const card = document.createElement('div');
        card.className = `category-card ${currentCategory === cat.slug ? 'active' : ''}`;
        card.innerHTML = `
            <div class="category-card-image-box">
                <img src="${meta.image}" alt="${cat.name}">
            </div>
            <div class="category-card-title">${cat.name}</div>
        `;
        
        card.addEventListener('click', () => {
            currentCategory = cat.slug;
            currentTag = null; // reset tag on category switch
            
            // update URL & Render All
            updateUrlParams();
            renderAll();
        });
        
        categoryCardsGrid.appendChild(card);
    }
    
    // Toggle show-more visibility
    if (allCategoriesList.length > categoriesLimit) {
        showMoreWrapper.style.display = 'block';
        if (showAllCategories) {
            showMoreCategoriesBtn.innerHTML = 'Thu gọn <i class="fa-solid fa-chevron-up"></i>';
        } else {
            const extraCount = allCategoriesList.length - categoriesLimit;
            showMoreCategoriesBtn.innerHTML = `Xem thêm (${extraCount}) <i class="fa-solid fa-chevron-down"></i>`;
        }
    } else {
        showMoreWrapper.style.display = 'none';
    }
    
    // Update Hero Title & Description
    const currentMeta = getCategoryMeta(currentCategory, (categories.find(c => c.slug === currentCategory) || {}).name);
    if (catHeroTitle) catHeroTitle.textContent = currentMeta.title;
    if (catHeroDesc) catHeroDesc.textContent = currentMeta.desc;
}

// Get unique manufacturers dynamically based on category
function getUniqueBrands() {
    const brandsSet = new Set();
    products.forEach(p => {
        if (p.manufacturer) {
            brandsSet.add(p.manufacturer);
        }
    });
    return Array.from(brandsSet).sort();
}

// Render brand checklist sidebar
function renderBrandFilter() {
    if (!brandFilterList) return;
    brandFilterList.innerHTML = '';
    
    const uniqueBrands = getUniqueBrands();
    if (uniqueBrands.length === 0) {
        brandFilterList.innerHTML = '<div class="filter-item-muted">Không có hãng nào</div>';
        return;
    }
    
    uniqueBrands.forEach(brand => {
        // Calculate count under current category filter
        const count = products.filter(p => {
            if (currentCategory !== 'all') {
                const catObj = categories.find(c => c.slug === currentCategory);
                if (!catObj || p.category_id !== catObj.id) return false;
            }
            return p.manufacturer === brand;
        }).length;
        
        // Hide manufacturer from list if it has no products under the currently selected category
        if (count === 0 && currentCategory !== 'all') return;
        
        const label = document.createElement('label');
        label.className = 'filter-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = selectedBrands.has(brand);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedBrands.add(brand);
            } else {
                selectedBrands.delete(brand);
            }
            updateUrlParams();
            renderAll();
        });
        
        const span = document.createElement('span');
        span.textContent = `${brand} (${count})`;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        brandFilterList.appendChild(label);
    });
}

// Render dynamic tags sidebar group
function renderSidebarTags() {
    if (!dynamicTagsList) return;
    dynamicTagsList.innerHTML = '';
    
    const tags = productCategoryTagLabels[currentCategory];
    if (tags && tags.length > 0) {
        tagsFilterGroup.style.display = 'block';
        
        // Add "Tất cả tag" button
        const allBtn = document.createElement('button');
        allBtn.className = `category-filter-btn ${!currentTag ? 'active' : ''}`;
        allBtn.style.padding = '8px 12px';
        allBtn.style.fontSize = '13px';
        allBtn.innerHTML = `<i class="fa-solid fa-tags"></i> Tất cả đặc tính`;
        allBtn.addEventListener('click', () => {
            currentTag = null;
            updateUrlParams();
            renderAll();
        });
        dynamicTagsList.appendChild(allBtn);
        
        // Add category-specific tag buttons
        tags.forEach(t => {
            const btn = document.createElement('button');
            btn.className = `category-filter-btn ${currentTag === t.tag ? 'active' : ''}`;
            btn.style.padding = '8px 12px';
            btn.style.fontSize = '13px';
            btn.innerHTML = `<i class="fa-solid fa-tag"></i> ${t.label}`;
            btn.addEventListener('click', () => {
                currentTag = t.tag;
                updateUrlParams();
                renderAll();
            });
            dynamicTagsList.appendChild(btn);
        });
    } else {
        tagsFilterGroup.style.display = 'none';
    }
}

// Render active filter chips row
function renderActiveChips() {
    // clear previous chips except clear button
    const chips = activeFiltersRow.querySelectorAll('.active-filter-pill');
    chips.forEach(c => c.remove());
    
    let activeCount = 0;
    
    if (currentCategory !== 'all') {
        const catObj = categories.find(c => c.slug === currentCategory);
        const name = catObj ? catObj.name : currentCategory;
        createChip(`Danh mục: ${name}`, () => {
            currentCategory = 'all';
            currentTag = null;
            updateUrlParams();
            renderAll();
        });
        activeCount++;
    }
    
    if (currentTag) {
        const tagList = productCategoryTagLabels[currentCategory] || [];
        const tagObj = tagList.find(t => t.tag === currentTag);
        const label = tagObj ? tagObj.label : currentTag;
        createChip(`Bộ lọc: ${label}`, () => {
            currentTag = null;
            updateUrlParams();
            renderAll();
        });
        activeCount++;
    }
    
    if (selectedBrands.size > 0) {
        selectedBrands.forEach(brand => {
            createChip(`Hãng: ${brand}`, () => {
                selectedBrands.delete(brand);
                updateUrlParams();
                renderAll();
            });
            activeCount++;
        });
    }
    
    if (searchKeyword) {
        createChip(`Tìm: "${searchKeyword}"`, () => {
            searchKeyword = '';
            const input = getHeaderSearchInput();
            if (input) input.value = '';
            updateUrlParams();
            renderAll();
        });
        activeCount++;
    }
    
    if (showTrialOnly) {
        createChip(`Có dùng thử`, () => {
            showTrialOnly = false;
            filterTrialOnly.checked = false;
            renderAll();
        });
        activeCount++;
    }

    if (showInStockOnly) {
        createChip(`Còn hàng`, () => {
            showInStockOnly = false;
            filterInStock.checked = false;
            renderAll();
        });
        activeCount++;
    }
    
    if (activeCount > 0) {
        activeFiltersRow.style.display = 'flex';
    } else {
        activeFiltersRow.style.display = 'none';
    }
}

function createChip(text, onRemove) {
    const chip = document.createElement('span');
    chip.className = 'active-filter-pill';
    chip.innerHTML = `${text} <i class="fa-solid fa-xmark"></i>`;
    chip.addEventListener('click', onRemove);
    activeFiltersRow.insertBefore(chip, clearAllFiltersBtn);
}

// Render Products Grid matching filters & sort
function renderProducts() {
    catalogGrid.innerHTML = '';
    
    // 1. Filter
    let filtered = products.filter(p => {
        // Category Filter
        if (currentCategory !== 'all') {
            const catObj = categories.find(c => c.slug === currentCategory);
            if (!catObj || p.category_id !== catObj.id) return false;
        }
        
        // Brand Filter
        if (selectedBrands.size > 0 && !selectedBrands.has(p.manufacturer)) return false;
        
        // Tag Filter
        if (currentTag) {
            const prodTags = p.tags ? p.tags.split(',') : [];
            if (!prodTags.includes(currentTag)) return false;
        }
        
        // Search Filter
        if (searchKeyword) {
            if (!p.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
        }
        
        // Trial Only
        if (showTrialOnly && !p.is_try_before_buy) return false;
        
        // In Stock Only
        if (showInStockOnly && p.stock_quantity <= 0) return false;
        
        return true;
    });
    
    // Update count labels
    resultsCountLabel.textContent = `Tìm thấy ${filtered.length} sản phẩm`;
    
    // Title updating
    if (currentCategory !== 'all') {
        const catObj = categories.find(c => c.slug === currentCategory);
        catalogTitle.textContent = catObj ? catObj.name : 'Thiết bị';
    } else {
        catalogTitle.textContent = 'Tất cả thiết bị công nghệ';
    }
    
    // 2. Sort
    if (currentSort === 'rent-asc') {
        filtered.sort((a, b) => a.trial_price_per_day - b.trial_price_per_day);
    } else if (currentSort === 'rent-desc') {
        filtered.sort((a, b) => b.trial_price_per_day - a.trial_price_per_day);
    } else if (currentSort === 'buy-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'buy-desc') {
        filtered.sort((a, b) => b.price - a.price);
    }
    
    // 3. Render
    if (filtered.length === 0) {
        catalogGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm khác nhé.</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(p => {
        const isOutOfStock = p.stock_quantity <= 0;
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="product-image-container" onclick="goToDetails(${p.id})">
                ${p.is_try_before_buy ? '<span class="trial-badge" style="background-color: #059669;">Thuê trước</span>' : ''}
                <span class="stock-badge ${isOutOfStock ? 'out-of-stock' : ''}">
                    ${isOutOfStock ? 'Hết hàng' : `Kho: ${p.stock_quantity}`}
                </span>
                <img src="${p.image_url || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500'}" alt="${p.name}">
            </div>
            <div class="product-info">
                <h4 class="product-name" title="${p.name}" onclick="goToDetails(${p.id})">
                    <span style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; display: block; margin-bottom: 2px;">${p.manufacturer || ''}</span>
                    ${p.name}
                </h4>
                <div class="product-pricing">
                    <div class="trial-price-row" style="font-size: 16px; font-weight: 800; color: #059669; margin-bottom: 4px;">
                        ${formatCurrency(p.trial_price_per_day)} <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);">/ ngày</span>
                    </div>
                    <div class="price-row">
                        <span style="font-size: 12px; color: var(--text-muted);">Giá mua đứt: ${formatCurrency(p.price)}</span>
                    </div>
                </div>
                <div class="product-actions" style="display: flex; gap: 8px;">
                    <button class="btn btn-outline" style="flex: 1; font-size: 12px; padding: 8px 4px; border-color: #059669; color: #059669;" onclick="goToDetails(${p.id})" ${isOutOfStock ? 'disabled' : ''}>
                        Dùng thử
                    </button>
                    <button class="btn btn-primary" style="flex: 1; font-size: 12px; padding: 8px 4px;" onclick="addToCart(${p.id}, 'buy')" ${isOutOfStock ? 'disabled' : ''}>
                        Mua đứt
                    </button>
                </div>
            </div>
        `;
        catalogGrid.appendChild(card);
    });
}

function goToDetails(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Master Render trigger
function renderAll() {
    renderCategoryCards();
    renderBrandFilter();
    renderSidebarTags();
    renderActiveChips();
    renderProducts();
}

// Load everything on DOM load
document.addEventListener('DOMContentLoaded', () => {
    fetchCatalogData();
});
