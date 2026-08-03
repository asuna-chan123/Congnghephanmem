// Các biến trạng thái
let cartList = [];
let selectedItemIds = [];
let isInitialLoad = true;

// kiểm tra nút thanh toán
document.addEventListener('DOMContentLoaded', () => {
    loadCartPage();
    loadRelatedItems();
});

// Tải trang giỏ hàng
async function loadCartPage() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCartView = document.getElementById('empty-cart-view');
    const cartLayout = document.getElementById('cart-layout');

    //gọi controller
    try {
        const data = await apiFetch('/api/cart');
        if (!data.success || !data.cart || data.cart.length === 0) {
            cartLayout.style.display = 'none';
            emptyCartView.style.display = 'block';
            return;
        }

        cartList = data.cart;
        cartLayout.style.display = 'grid';
        emptyCartView.style.display = 'none';

        // Tải giỏ hàng
        if (isInitialLoad) {
            selectedItemIds = cartList.map(item => String(item.uniqueId));
            isInitialLoad = false;
        } else {
            const currentIds = cartList.map(item => String(item.uniqueId));
            selectedItemIds = selectedItemIds.map(id => String(id)).filter(id => currentIds.includes(id));
        }

        renderCartItems();
        recalculateTotals();
        updateSelectAllCheckboxState();
    } catch (e) {
        console.error('Error loading cart page:', e);
        cartItemsContainer.innerHTML = '<div class="cart-loading">Lỗi tải giỏ hàng. Vui lòng thử lại sau.</div>';
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    container.innerHTML = '';

    cartList.forEach(item => {
        const idStr = String(item.uniqueId);
        const isChecked = selectedItemIds.includes(idStr);
        const card = document.createElement('div');
        card.className = 'cart-item-card';
        const rentalDays = item.rentalDays || 1;
        const qty = item.quantity || 1;
        const itemRentalTotal = (item.price * rentalDays * qty);
        const itemDeposit = (item.deposit || 0) * qty;

        card.innerHTML = `
            <!-- Checkbox -->
            <div class="cart-item-checkbox-col">
                <label class="xiaomi-checkbox-wrapper">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleItemSelect('${idStr}', this.checked)">
                    <span class="xiaomi-checkbox-mark"></span>
                </label>
            </div>

            <!-- Image -->
            <div class="cart-item-image-col">
                <img src="${item.image || 'https://via.placeholder.com/160'}" alt="${item.name}">
            </div>

            <!-- Details & Price -->
            <div class="cart-item-info-col">
                <a href="/product.html?id=${item.productId}" class="cart-item-title-link">${item.name}</a>
                ${item.rental_start_date && item.rental_end_date ? `
                <span class="cart-item-dates" style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px; display: block;">
                    <i class="fa-regular fa-calendar-days" style="margin-right: 4px; color: var(--accent);"></i>
                    Thuê ${rentalDays} ngày (${new Date(item.rental_start_date).toLocaleDateString('vi-VN')} - ${new Date(item.rental_end_date).toLocaleDateString('vi-VN')})
                </span>
                ` : ''}
                
                <div style="margin-top: 6px;">
                    <span class="cart-item-price" style="font-size: 14px; font-weight: 600; color: var(--accent);">
                        Tiền thuê: ${formatCurrency(itemRentalTotal)} 
                        <small style="font-size: 11px; font-weight: normal; color: var(--text-tertiary)">(${formatCurrency(item.price)}/ngày${qty > 1 ? ` x ${qty}` : ''})</small>
                    </span>
                    <span style="display: block; font-size: 12px; color: #666; margin-top: 2px;">
                        Tiền cọc: <strong>${formatCurrency(itemDeposit)}</strong> ${qty > 1 ? `<small style="font-size: 11px; color: var(--text-tertiary); font-weight: normal;">(${formatCurrency(item.deposit)} x ${qty})</small>` : ''}
                    </span>
                </div>
            </div>

            <!-- Controls -->
            <div class="cart-item-controls-col">
                <div class="cart-item-stepper-wrapper">
                    <div class="cart-quantity-stepper">
                        <button class="cart-stepper-btn" onclick="adjustCartQty('${idStr}', -1)"><i class="fa-solid fa-minus"></i></button>
                        <input type="number" 
                               class="cart-stepper-val" 
                               value="${item.quantity}" 
                               min="1" 
                               max="${item.stock_quantity || 999}"
                               inputmode="numeric"
                               pattern="[0-9]*"
                               oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                               onkeydown="if(['e','E','+','-','.',','].includes(event.key)) event.preventDefault(); if(event.key === 'Enter') this.blur();"
                               onchange="updateCartQtyManual('${idStr}', this.value, ${item.stock_quantity || 999})">
                        <button class="cart-stepper-btn" onclick="adjustCartQty('${idStr}', 1)"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <span class="stepper-limit-hint">* Còn lại ${item.stock_quantity || 0} sản phẩm</span>
                </div>
                
                <button class="cart-item-trash-btn" onclick="removeAndReload('${idStr}')" title="Xóa sản phẩm">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function recalculateTotals() {
    let totalRent = 0;
    let totalDeposit = 0;

    cartList.forEach(item => {
        if (selectedItemIds.includes(String(item.uniqueId))) {
            const days = item.rentalDays || 1;
            const qty = item.quantity || 1;

            totalRent += (item.price * days * qty);
            totalDeposit += ((item.deposit || 0) * qty);
        }
    });

    const grandTotal = totalRent + totalDeposit;

    const subtotalEl = document.getElementById('summary-subtotal');
    const depositEl = document.getElementById('summary-deposit');
    const totalEl = document.getElementById('summary-total');

    if (subtotalEl) subtotalEl.textContent = formatCurrency(totalRent);
    if (depositEl) depositEl.textContent = formatCurrency(totalDeposit);
    if (totalEl) totalEl.textContent = formatCurrency(grandTotal);
}

function updateSelectAllCheckboxState() {
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (!selectAllCheckbox) return;

    if (cartList.length === 0) {
        selectAllCheckbox.checked = false;
        return;
    }

    const allSelected = cartList.length > 0 && cartList.every(item => selectedItemIds.includes(String(item.uniqueId)));
    selectAllCheckbox.checked = allSelected;
}

window.toggleItemSelect = function (uniqueId, isChecked) {
    const idStr = String(uniqueId);
    if (isChecked) {
        if (!selectedItemIds.includes(idStr)) {
            selectedItemIds.push(idStr);
        }
    } else {
        selectedItemIds = selectedItemIds.filter(id => String(id) !== idStr);
    }
    recalculateTotals();
    updateSelectAllCheckboxState();
};

window.toggleSelectAll = function (checkbox) {
    if (checkbox.checked) {
        selectedItemIds = cartList.map(item => String(item.uniqueId));
    } else {
        selectedItemIds = [];
    }
    renderCartItems();
    recalculateTotals();
};

window.deleteSelectedItems = async function () {
    if (selectedItemIds.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để xóa!');
        return;
    }

    if (!confirm('Bạn có chắc chắn muốn xóa các sản phẩm đã chọn khỏi giỏ hàng?')) {
        return;
    }

    try {
        for (const id of selectedItemIds) {
            await apiFetch(`/api/cart/${id}`, { method: 'DELETE' });
        }
        selectedItemIds = [];
        loadCart(); // update header badge
        loadCartPage(); // refresh cart list
    } catch (e) {
        console.error('Error deleting selected items:', e);
        alert('Lỗi khi xóa các mục đã chọn.');
    }
};

window.adjustCartQty = async function (uniqueId, change) {
    const idStr = String(uniqueId);
    const item = cartList.find(i => String(i.uniqueId) === idStr);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty < 1) return;

    const maxQty = item.stock_quantity || 999;
    if (newQty > maxQty) {
        alert(`Rất tiếc, kho hàng chỉ còn lại ${maxQty} sản phẩm này.`);
        return;
    }

    try {
        const res = await apiFetch(`/api/cart/${idStr}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: newQty })
        });
        if (res.success) {
            loadCart();
            loadCartPage();
        } else {
            alert('Lỗi cập nhật số lượng: ' + res.message);
        }
    } catch (e) {
        console.error('Error updating quantity:', e);
        alert('Lỗi kết nối máy chủ khi cập nhật số lượng.');
    }
};

window.updateCartQtyManual = async function (uniqueId, rawVal, maxStock = 999) {
    const idStr = String(uniqueId);
    const item = cartList.find(i => String(i.uniqueId) === idStr);
    if (!item) return;

    let sanitized = String(rawVal).replace(/[^0-9]/g, '');
    let newQty = parseInt(sanitized, 10);
    if (isNaN(newQty) || newQty < 1) {
        newQty = 1;
    }

    const maxQty = maxStock || item.stock_quantity || 999;
    if (newQty > maxQty) {
        alert(`Rất tiếc, kho hàng chỉ còn lại ${maxQty} sản phẩm này.`);
        newQty = maxQty;
    }

    if (newQty === item.quantity) {
        renderCartItems();
        return;
    }

    try {
        const res = await apiFetch(`/api/cart/${idStr}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: newQty })
        });
        if (res.success) {
            loadCart();
            loadCartPage();
        } else {
            alert('Lỗi cập nhật số lượng: ' + res.message);
            loadCartPage();
        }
    } catch (e) {
        console.error('Error updating quantity manually:', e);
        alert('Lỗi kết nối máy chủ khi cập nhật số lượng.');
        loadCartPage();
    }
};

window.removeAndReload = async function (cartItemId) {
    try {
        const res = await apiFetch(`/api/cart/${cartItemId}`, { method: 'DELETE' });
        if (res.success) {
            loadCart();
            loadCartPage();
        }
    } catch (e) {
        console.error('Error removing cart item:', e);
    }
};

window.toggleWhyMi = function () {
    const body = document.getElementById('why-mi-body');
    const chevron = document.getElementById('why-mi-chevron');
    if (!body) return;

    if (body.classList.contains('expanded')) {
        body.classList.remove('expanded');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        body.classList.add('expanded');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
};

document.getElementById('checkout-submit-btn')?.addEventListener('click', (e) => {
    e.preventDefault();

    // Kiểm tra xem người dùng đã chọn sản phẩm nào chưa
    if (selectedItemIds.length === 0) {
        if (typeof showStatusPopup === 'function') {
            showStatusPopup(false, 'Vui lòng chọn ít nhất một sản phẩm để thanh toán!');
        } else {
            alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán!');
        }
        return;
    }

    // Convert uniqueId back to cart_item_id if available, or filter cartList
    const selectedCartItemIds = cartList
        .filter(item => selectedItemIds.includes(String(item.uniqueId)))
        .map(item => item.cart_item_id || item.uniqueId);

    sessionStorage.setItem('checkout_selected_items', JSON.stringify(selectedCartItemIds));

    executeWithAuth(() => {
        window.location.href = 'payment.html';
    });
});

async function loadRelatedItems() {
    try {
        const response = await fetch('/api/home-data');
        const data = await response.json();
        const grid = document.getElementById('related-items-grid');

        if (data.success && data.tryBeforeBuy) {
            grid.innerHTML = '';
            data.tryBeforeBuy.slice(0, 4).forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-image-container">
                        <img src="${product.image_url}" alt="${product.name}" loading="lazy">
                        ${product.is_new ? '<span class="badge badge-new">Mới về hàng</span>' : ''}
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-price-block">
                            <div class="trial-price">
                                <i class="fa-solid fa-rotate"></i> ${formatCurrency(product.trial_price_per_day)}/ngày
                            </div>
                        </div>
                        <div class="product-actions" style="margin-top: 10px;">
                            <button class="btn btn-outline" onclick="addToCart(${product.id}, 'trial')">Thử trước</button>
                            <button class="btn btn-primary" onclick="addToCart(${product.id}, 'buy')">Mua ngay</button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading related items:', error);
    }
}

// Global format currency fallback if not defined
if (typeof formatCurrency !== 'function') {
    window.formatCurrency = function (value) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }
}
