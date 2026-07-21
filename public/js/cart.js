// State variables
let cartList = [];
let selectedItemIds = [];

// #checkout-submit-btn
document.addEventListener('DOMContentLoaded', () => {
    loadCartPage();
    loadRelatedItems();
});

//load cart page
async function loadCartPage() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCartView = document.getElementById('empty-cart-view');
    const cartLayout = document.getElementById('cart-layout');

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

        // Select all items by default on first load
        if (selectedItemIds.length === 0 && cartList.length > 0) {
            selectedItemIds = cartList.map(item => String(item.uniqueId));
        } else {
            // Filter out selected items that no longer exist in the cart
            const currentIds = cartList.map(item => String(item.uniqueId));
            selectedItemIds = selectedItemIds.filter(id => currentIds.includes(String(id)));
        }

        renderCartItems();
        recalculateTotals();
        updateSelectAllCheckboxState();
    } catch (e) {
        console.error('Error loading cart page:', e);
        cartItemsContainer.innerHTML = '<div class="cart-loading">Lỗi tải giỏ hàng. Vui lòng thử lại sau.</div>';
    }
}

function getRentalDays(item) {
    if (item.rental_start_date && item.rental_end_date) {
        const start = new Date(item.rental_start_date);
        const end = new Date(item.rental_end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
    }
    return 1;
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    container.innerHTML = '';

    cartList.forEach(item => {
        const isChecked = selectedItemIds.includes(String(item.uniqueId));
        const days = getRentalDays(item);
        const itemDeposit = item.price * 30 * item.quantity;
        const card = document.createElement('div');
        card.className = 'cart-item-card';
        card.innerHTML = `
            <!-- Checkbox -->
            <div class="cart-item-checkbox-col">
                <label class="xiaomi-checkbox-wrapper">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleItemSelect('${item.uniqueId}', this.checked)">
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
                    Thuê: ${new Date(item.rental_start_date).toLocaleDateString('vi-VN')} - ${new Date(item.rental_end_date).toLocaleDateString('vi-VN')} (${days} ngày)
                </span>
                ` : ''}
                <span class="cart-item-price">${formatCurrency(item.price)} <span style="font-size: 11px; font-weight: normal; color: var(--text-tertiary)">/ ngày</span></span>
                <span class="cart-item-deposit" style="font-size: 11px; color: #6e6e73; margin-top: 4px; display: block; background: rgba(0,0,0,0.03); padding: 4px 8px; border-radius: 6px; width: fit-content;">
                    <i class="fa-solid fa-shield-cat" style="margin-right: 4px; color: #ff9f0a;"></i> Tiền cọc (30 ngày): <strong>${formatCurrency(itemDeposit)}</strong>
                </span>
            </div>

            <!-- Quantity Stepper & Trash -->
            <div class="cart-item-controls-col">
                <div class="cart-item-stepper-wrapper">
                    <div class="cart-quantity-stepper">
                        <button class="cart-stepper-btn" onclick="adjustCartQty('${item.uniqueId}', -1)"><i class="fa-solid fa-minus"></i></button>
                        <input type="text" class="cart-stepper-val" value="${item.quantity}" readonly>
                        <button class="cart-stepper-btn" onclick="adjustCartQty('${item.uniqueId}', 1)"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <span class="stepper-limit-hint">* Còn lại ${item.stock_quantity || 0} sản phẩm</span>
                </div>
                
                <button class="cart-item-trash-btn" onclick="removeAndReload('${item.uniqueId}')" title="Xóa sản phẩm">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function recalculateTotals() {
    let rentalTotal = 0;
    let depositTotal = 0;
    let itemCount = 0;

    cartList.forEach(item => {
        if (selectedItemIds.includes(String(item.uniqueId))) {
            const days = getRentalDays(item);
            rentalTotal += (item.price * days * item.quantity);
            depositTotal += (item.price * 30 * item.quantity); // 30 ngày cọc
            itemCount += item.quantity;
        }
    });

    const subtotal = rentalTotal;
    const deposit = depositTotal;
    const delivery = 0; // free delivery
    const total = subtotal + deposit + delivery;

    const subtotalElem = document.getElementById('summary-subtotal');
    if (subtotalElem) subtotalElem.textContent = formatCurrency(subtotal);

    const depositElem = document.getElementById('summary-deposit');
    if (depositElem) depositElem.textContent = formatCurrency(deposit);

    const totalElem = document.getElementById('summary-total');
    if (totalElem) totalElem.textContent = formatCurrency(total);
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
        // Delete items sequentially or map them
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

//Test update
window.adjustCartQty = async function (uniqueId, change) {
    const item = cartList.find(i => i.uniqueId === uniqueId);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty < 1) return;

    const maxQty = item.stock_quantity || 5;
    if (newQty > maxQty) {
        alert(`Rất tiếc, kho hàng chỉ còn lại ${maxQty} sản phẩm này.`);
        return;
    }

    try {
        const res = await apiFetch(`/api/cart/${uniqueId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: newQty })
        });
        if (res.success) {
            loadCart(); // update header badge
            loadCartPage(); // refresh cart list
        } else {
            alert('Lỗi cập nhật số lượng: ' + res.message);
        }
    } catch (e) {
        console.error('Error updating quantity:', e);
        alert('Lỗi kết nối máy chủ khi cập nhật số lượng.');
    }
};

window.removeAndReload = async function (cartItemId) {
    try {
        const res = await apiFetch(`/api/cart/${cartItemId}`, { method: 'DELETE' });
        if (res.success) {
            loadCart(); // update header badge
            loadCartPage(); // refresh cart list
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

function showVerificationWarningPopup() {
    const existing = document.getElementById('verification-warning-modal');
    if (existing) existing.remove();

    const modalHtml = `
        <div id="verification-warning-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
        ">
            <div style="
                background: white;
                border-radius: 20px;
                max-width: 440px;
                width: 100%;
                padding: 32px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                border: 1px solid rgba(0,0,0,0.05);
                animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            ">
                <div style="
                    background: rgba(255, 159, 10, 0.1);
                    color: #ff9f0a;
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                ">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 28px;"></i>
                </div>
                
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1d1d1f;">Yêu cầu hoàn thiện hồ sơ</h3>
                
                <p style="font-size: 14px; color: #8e8e93; line-height: 1.5; margin-bottom: 24px;">
                    Để đảm bảo an toàn giao dịch thuê thiết bị, vui lòng cập nhật đầy đủ **Số CCCD (Xác minh danh tính)** và **Thông tin Ngân hàng (Nhận hoàn cọc)**.
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button onclick="window.location.href='/profile'" style="
                        width: 100%;
                        background: #1d1d1f;
                        color: white;
                        border: none;
                        border-radius: 12px;
                        padding: 12px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: opacity 0.2s;
                    ">Cập nhật hồ sơ ngay</button>
                    <button onclick="document.getElementById('verification-warning-modal').remove()" style="
                        width: 100%;
                        background: transparent;
                        color: #8e8e93;
                        border: none;
                        padding: 10px;
                        font-size: 13px;
                        cursor: pointer;
                    ">Để sau</button>
                </div>
            </div>
            <style>
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            </style>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

document.getElementById('checkout-submit-btn')?.addEventListener('click', async () => {
    if (selectedItemIds.length === 0) {
        if (typeof showStatusPopup === 'function') {
            showStatusPopup(false, 'Vui lòng chọn ít nhất một sản phẩm để thanh toán!');
        } else {
            alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán!');
        }
        return;
    }

    //check login
    const currentUserJson = localStorage.getItem('currentUser');
    if (!currentUserJson) {
        if (typeof showStatusPopup === 'function') {
            showStatusPopup(false, 'Vui lòng đăng nhập trước khi thanh toán.');
        } else {
            alert('Vui lòng đăng nhập trước khi thanh toán.');
        }
        if (typeof window.openSignInModal === 'function') {
            window.openSignInModal();
        }
        return;
    }

    // Check profile info completeness (CCCD & Bank)
    try {
        const profileRes = await apiFetch('/api/auth/profile');
        if (!profileRes.success || !profileRes.user) {
            alert('Không thể xác thực thông tin hồ sơ.');
            return;
        }

        const user = profileRes.user;
        const hasCCCD = (user.identityNumber && user.identityNumber.trim().length > 0) || user.identityImageFront || user.identityImageBack;
        const hasBank = user.bankName && user.bankName.trim().length > 0 && user.bankAccountNumber && user.bankAccountNumber.trim().length > 0;

        if (!hasCCCD || !hasBank) {
            showVerificationWarningPopup();
            return;
        }
    } catch (err) {
        console.error('Error verifying profile before checkout:', err);
        alert('Lỗi kết nối máy chủ khi xác thực thông tin tài khoản.');
        return;
    }

    if (typeof showStatusPopup === 'function') {
        showStatusPopup(true, 'Đang tiến hành đặt hàng & thanh toán các mục đã chọn...');
    } else {
        alert('Đang tiến hành đặt hàng & thanh toán các mục đã chọn...');
    }

    try {
        const res = await apiFetch('/api/cart/checkout', {
            method: 'POST',
            body: JSON.stringify({ selectedItemIds })
        });
        if (res.success) {
            selectedItemIds = [];
            loadCart(); // update header
            showStatusPopup(true, 'Đặt hàng & thanh toán thành công!', true);
            setTimeout(() => {
                window.location.href = '/orders.html';
            }, 1500);
        } else {
            showStatusPopup(false, res.message || 'Lỗi đặt hàng.');
        }
    } catch (e) {
        console.error('Error checkout:', e);
        if (typeof showStatusPopup === 'function') {
            showStatusPopup(false, e.message || 'Lỗi đặt hàng.');
        } else {
            alert(e.message || 'Lỗi đặt hàng.');
        }
    }
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
