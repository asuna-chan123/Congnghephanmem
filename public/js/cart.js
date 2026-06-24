document.addEventListener('DOMContentLoaded', () => {
    loadCartPage();
    loadRelatedItems();
});

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

        const cartItems = data.cart;
        cartLayout.style.display = 'grid';
        emptyCartView.style.display = 'none';

        cartItemsContainer.innerHTML = '';
        let itemsTotal = 0;

        cartItems.forEach(item => {
            itemsTotal += (item.price * item.quantity);
        
        // Mock original price and discount for UI purposes (similar to Etsy)
        const discountPercent = 15;
        const originalPrice = Math.round(item.price / (1 - discountPercent/100));
        
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item-row';
        itemEl.innerHTML = `
            <img src="${item.image || 'https://via.placeholder.com/160'}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h3 class="cart-item-title">${item.name}</h3>
                <div class="cart-item-options">Loại: ${item.type}</div>
                <div class="cart-item-stock"><i class="fa-solid fa-check"></i> Còn hàng</div>
                
                <div class="cart-item-actions">
                    <select>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                    <button>Chỉnh sửa</button>
                    <button>Lưu lại sau</button>
                    <button onclick="removeAndReload('${item.uniqueId}')">Xóa</button>
                </div>
            </div>
            <div class="cart-item-price-col">
                <span class="discount-badge">Giảm ${discountPercent}%</span>
                <span class="original-price">${formatCurrency(originalPrice)}</span>
                <span class="current-price">${formatCurrency(item.price)}</span>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: auto;">Có thể áp dụng mã giảm giá</div>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    updateCartSummary(itemsTotal, cartItems.length);
    } catch (e) {
        console.error('Error loading cart page:', e);
        cartItemsContainer.innerHTML = '<p>Lỗi tải giỏ hàng.</p>';
    }
}

function updateCartSummary(itemsTotal, itemCount) {
    const discountAmount = itemsTotal * 0.15; // Mock 15% discount
    const subtotal = itemsTotal - discountAmount;
    const delivery = 30000; // Mock delivery
    const total = subtotal + delivery;

    document.getElementById('summary-items-total').textContent = formatCurrency(itemsTotal);
    document.getElementById('summary-discount').textContent = '-' + formatCurrency(discountAmount);
    document.getElementById('summary-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('summary-delivery').textContent = formatCurrency(delivery);
    document.getElementById('summary-total').textContent = formatCurrency(total);
    document.getElementById('summary-total-label').textContent = `Tổng cộng (${itemCount} sản phẩm)`;
}

window.removeAndReload = async function(cartItemId) {
    try {
        const res = await apiFetch(`/api/cart/${cartItemId}`, { method: 'DELETE' });
        if (res.success) {
            loadCart(); // update header badge
            loadCartPage(); // refresh cart list
        }
    } catch (e) {
        console.error('Error removing cart item', e);
    }
};

document.getElementById('checkout-submit-btn')?.addEventListener('click', async () => {
    alert('Đang chuyển hướng tới trang thanh toán...');
    try {
        await apiFetch('/api/cart', { method: 'DELETE' });
        window.location.href = '/';
    } catch (e) {
        console.error('Error checkout', e);
    }
});

async function loadRelatedItems() {
    try {
        const response = await fetch('/api/home-data');
        const data = await response.json();
        const grid = document.getElementById('related-items-grid');
        
        if (data.success && data.tryBeforeBuy) {
            grid.innerHTML = '';
            // Display first 4 items as related
            data.tryBeforeBuy.slice(0, 4).forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-image-container">
                        <img src="${product.image_url}" alt="${product.name}" loading="lazy">
                        ${product.is_new ? '<span class="badge badge-new">Mới</span>' : ''}
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-price-block">
                            <div class="trial-price">
                                <i class="fa-solid fa-rotate"></i> ${formatCurrency(product.trial_price_per_day)}/ngày
                            </div>
                            <div class="buy-price-small">
                                Giá mua: <span class="buy-price-value">${formatCurrency(product.price)}</span>
                            </div>
                        </div>
                        <div class="product-actions">
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
