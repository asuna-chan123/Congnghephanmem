// State Management
let products = [];
let categories = [];
let cart = [];

// Filters State
let currentCategory = 'all'; // 'all', 'dien-thoai', 'laptop', 'may-anh'
let selectedTags = new Set();
let selectedBrands = new Set();
let searchKeyword = '';
let showTrialOnly = false;
let showInStockOnly = false;
let currentSort = 'default';

// Category Cards Collapsible State
let showAllCategories = true;
const categoriesLimit = 999; // Show all category cards (Apple-style single row)

// Category UI configurations
const categoryMetadata = {
    'all': {
        title: 'Tất cả thiết bị công nghệ',
        desc: 'Khám phá và trải nghiệm các thiết bị công nghệ đỉnh cao trước khi quyết định sở hữu',
        image: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-card-50-compare-models-202603?wid=960&hei=1000&fmt=p-jpg&qlt=95&.v=VVlYUmhtQ01FUnVZSm9ubk84akVKQVhDbGhXa21pNVNBVURtbkZ6K0ZoSHpIR0l0TVpNQnJZb1NNY29pWWhnM1pwRE93ZVBDaGlEa25QZUpFTG9OUTY2TXlIZTdvcW0vUW90dllTQklLcUJ0VktRME9sRTEwdS8xcGRlRVdEOFc'
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

// Yêu cầu dữ liệu từ Server
async function fetchCatalogData() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();

        if (data.success) {
            products = data.products;
            categories = data.categories;

            // Read query params
            parseQueryParams();

            // Search
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
    selectedTags.clear();
    if (tagParam) {
        tagParam.split(',').forEach(t => selectedTags.add(t.trim()));
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
    // Dropdown Toggling - Samsung Style
    const dropdownTriggers = [
        { btnId: 'btn-filter-brand', menuId: 'menu-filter-brand' },
        { btnId: 'btn-filter-tag', menuId: 'menu-filter-tag' },
        { btnId: 'btn-filter-status', menuId: 'menu-filter-status' },
        { btnId: 'btn-filter-sort', menuId: 'menu-filter-sort' }
    ];

    dropdownTriggers.forEach(({ btnId, menuId }) => {
        const btn = document.getElementById(btnId);
        const menu = document.getElementById(menuId);
        if (btn && menu) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other menus
                dropdownTriggers.forEach(other => {
                    if (other.btnId !== btnId) {
                        const otherMenu = document.getElementById(other.menuId);
                        if (otherMenu) otherMenu.classList.remove('show');
                    }
                });
                menu.classList.toggle('show');
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        dropdownTriggers.forEach(({ menuId }) => {
            const menu = document.getElementById(menuId);
            if (menu) menu.classList.remove('show');
        });
    });

    // Stop propagation inside dropdown menus to prevent closing
    dropdownTriggers.forEach(({ menuId }) => {
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
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

    // Sort radio buttons handler
    const sortRadios = document.querySelectorAll('input[name="sort-option"]');
    sortRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentSort = e.target.value;

            // Update button label
            const btnSort = document.getElementById('btn-filter-sort');
            if (btnSort) {
                const labelText = e.target.nextElementSibling.textContent;
                btnSort.innerHTML = `Sắp xếp: ${labelText} <i class="fa-solid fa-chevron-down"></i>`;

                if (currentSort !== 'default') {
                    btnSort.classList.add('active');
                } else {
                    btnSort.classList.remove('active');
                }
            }

            // Close dropdown
            const menuSort = document.getElementById('menu-filter-sort');
            if (menuSort) menuSort.classList.remove('show');

            renderAll();
        });
    });

    // Clear filters button
    clearAllFiltersBtn.addEventListener('click', () => {
        currentCategory = 'all';
        selectedTags.clear();
        selectedBrands.clear();
        searchKeyword = '';
        showTrialOnly = false;
        showInStockOnly = false;
        currentSort = 'default';

        const input = getHeaderSearchInput();
        if (input) input.value = '';
        filterTrialOnly.checked = false;
        filterInStock.checked = false;

        // Reset sort radio option
        const defaultRadio = document.querySelector('input[name="sort-option"][value="default"]');
        if (defaultRadio) defaultRadio.checked = true;

        const btnSort = document.getElementById('btn-filter-sort');
        if (btnSort) {
            btnSort.innerHTML = `Sắp xếp: Mặc định <i class="fa-solid fa-chevron-down"></i>`;
            btnSort.classList.remove('active');
        }

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

    if (selectedTags.size > 0) {
        url.searchParams.set('tag', Array.from(selectedTags).join(','));
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
        const cardImage = cat.image_url || meta.image;
        card.innerHTML = `
            <div class="category-card-image-box">
                <img src="${cardImage}" alt="${cat.name}">
            </div>
            <div class="category-card-title">${cat.name}</div>
        `;

        card.addEventListener('click', () => {
            currentCategory = cat.slug;
            selectedTags.clear(); // reset tags on category switch

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

// Render brand checklist
function renderBrandFilter() {
    if (!brandFilterList) return;
    brandFilterList.innerHTML = '';

    const uniqueBrands = getUniqueBrands();
    const btnBrand = document.getElementById('btn-filter-brand');

    // Update button text to reflect selection count
    if (btnBrand) {
        if (selectedBrands.size > 0) {
            btnBrand.innerHTML = `Hãng: ${selectedBrands.size} <i class="fa-solid fa-chevron-down"></i>`;
            btnBrand.classList.add('active');
        } else {
            btnBrand.innerHTML = `Hãng sản xuất <i class="fa-solid fa-chevron-down"></i>`;
            btnBrand.classList.remove('active');
        }
    }

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
        label.className = 'filter-dropdown-item';

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

// Render dynamic tags dropdown
function renderSidebarTags() {
    const wrapper = document.getElementById('tags-filter-dropdown-wrapper');
    if (!dynamicTagsList || !wrapper) return;
    dynamicTagsList.innerHTML = '';

    const tags = productCategoryTagLabels[currentCategory];
    const btnTag = document.getElementById('btn-filter-tag');

    // Update button text to reflect tag selection count
    if (btnTag) {
        if (selectedTags.size > 0) {
            btnTag.innerHTML = `Đặc tính: ${selectedTags.size} <i class="fa-solid fa-chevron-down"></i>`;
            btnTag.classList.add('active');
        } else {
            btnTag.innerHTML = `Đặc tính thiết bị <i class="fa-solid fa-chevron-down"></i>`;
            btnTag.classList.remove('active');
        }
    }

    if (tags && tags.length > 0) {
        wrapper.style.display = 'block';

        tags.forEach(t => {
            const label = document.createElement('label');
            label.className = 'filter-dropdown-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selectedTags.has(t.tag);
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedTags.add(t.tag);
                } else {
                    selectedTags.delete(t.tag);
                }
                updateUrlParams();
                renderAll();
            });

            const span = document.createElement('span');
            span.textContent = t.label;

            label.appendChild(checkbox);
            label.appendChild(span);
            dynamicTagsList.appendChild(label);
        });
    } else {
        wrapper.style.display = 'none';
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
            selectedTags.clear();
            updateUrlParams();
            renderAll();
        });
        activeCount++;
    }

    if (selectedTags.size > 0) {
        selectedTags.forEach(tag => {
            const tagList = productCategoryTagLabels[currentCategory] || [];
            const tagObj = tagList.find(t => t.tag === tag);
            const label = tagObj ? tagObj.label : tag;
            createChip(`Đặc tính: ${label}`, () => {
                selectedTags.delete(tag);
                updateUrlParams();
                renderAll();
            });
            activeCount++;
        });
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
    activeFiltersRow.appendChild(chip);
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

        // Tag Filter (Multi-condition: OR logic, matches any selected tag)
        if (selectedTags.size > 0) {
            const prodTags = p.tags ? p.tags.split(',') : [];
            const hasMatchingTag = prodTags.some(t => selectedTags.has(t));
            if (!hasMatchingTag) return false;
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
        const card = document.createElement('product-card');
        card.setAttribute('product-id', p.id);
        card.setAttribute('name', p.name);
        card.setAttribute('price', p.price);
        card.setAttribute('trial-price', p.trial_price_per_day);
        card.setAttribute('image-url', p.image_url || '');
        card.setAttribute('manufacturer', p.manufacturer || '');
        card.setAttribute('stock-quantity', p.stock_quantity);
        card.setAttribute('is-try', p.is_try_before_buy ? '1' : '0');
        card.setAttribute('tags', p.tags || '');
        card.className = 'visible';

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
