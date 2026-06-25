// State Management
let products = [];
let categories = [];
let cart = [];

// Filters State
let currentCategory = 'all'; // 'all', 'dien-thoai', 'laptop', 'may-anh'
let currentTag = null;
let searchKeyword = '';
let showTrialOnly = false;
let showInStockOnly = false;
let currentSort = 'default';

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
const categoryFilterBtns = document.querySelectorAll('#category-filter-list .category-filter-btn');
const tagsFilterGroup = document.getElementById('tags-filter-group');
const dynamicTagsList = document.getElementById('dynamic-tags-list');
const filterTrialOnly = document.getElementById('filter-trial-only');
const filterInStock = document.getElementById('filter-in-stock');
const activeFiltersRow = document.getElementById('active-filters-row');
const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');
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
        // update active button in sidebar
        categoryFilterBtns.forEach(btn => {
            if (btn.getAttribute('data-category') === catParam) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    const tagParam = params.get('tag');
    if (tagParam) {
        currentTag = tagParam;
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
    // Category click handler
    categoryFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentCategory = btn.getAttribute('data-category');
            currentTag = null; // reset tag on category switch
            
            // Update URL search parameters
            updateUrlParams();
            
            renderAll();
        });
    });

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
        searchKeyword = '';
        showTrialOnly = false;
        showInStockOnly = false;
        currentSort = 'default';
        
        const input = getHeaderSearchInput();
        if (input) input.value = '';
        filterTrialOnly.checked = false;
        filterInStock.checked = false;
        sortSelect.value = 'default';
        
        categoryFilterBtns.forEach(b => {
            if (b.getAttribute('data-category') === 'all') b.classList.add('active');
            else b.classList.remove('active');
        });
        
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
    
    if (searchKeyword) {
        url.searchParams.set('search', searchKeyword);
    } else {
        url.searchParams.delete('search');
    }
    
    window.history.pushState({}, '', url);
}

// Render dynamic tags sidebar group
function renderSidebarTags() {
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
            categoryFilterBtns.forEach(b => {
                if (b.getAttribute('data-category') === 'all') b.classList.add('active');
                else b.classList.remove('active');
            });
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
                <h4 class="product-name" title="${p.name}" onclick="goToDetails(${p.id})">${p.name}</h4>
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
    renderSidebarTags();
    renderActiveChips();
    renderProducts();
}



// Load everything on DOM load
document.addEventListener('DOMContentLoaded', () => {
    fetchCatalogData();
});
