document.addEventListener('DOMContentLoaded', () => {
    loadFavoritesPage();
});

async function loadFavoritesPage() {
    const grid = document.getElementById('favorites-grid');
    const emptyView = document.getElementById('empty-favorites-view');

    try {
        const data = await apiFetch('/api/favorites');
        
        if (data.success && data.products) {
            const favoritedProducts = data.products;
            
            if (favoritedProducts.length === 0) {
                grid.style.display = 'none';
                emptyView.style.display = 'block';
                return;
            }

            grid.style.display = 'grid';
            emptyView.style.display = 'none';
            grid.innerHTML = '';

            favoritedProducts.forEach(product => {
                const card = document.createElement('div');
                card.className = 'fav-card';
                card.onclick = (e) => {
                    if (!e.target.closest('.fav-card-heart') && !e.target.closest('.btn-fav-action')) {
                        window.location.href = `/product.html?id=${product.id}`;
                    }
                };

                // category label mapping based on category_id
                let categoryLabel = 'Thiết bị';
                if (product.category_id === 1) categoryLabel = 'Laptop / Máy tính';
                else if (product.category_id === 2) categoryLabel = 'Điện thoại / Smartphone';
                else if (product.category_id === 3) categoryLabel = 'Máy ảnh / Camera';

                card.innerHTML = `
                    <div class="fav-card-heart" onclick="removeFavorite(${product.id}, event)" title="Xóa khỏi yêu thích">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                    <div class="fav-card-image-wrapper">
                        <img src="${product.image_url}" class="fav-card-image" alt="${product.name}">
                    </div>
                    <div class="fav-card-info">
                        <div class="fav-card-category">${categoryLabel}</div>
                        <div class="fav-card-title" title="${product.name}">${product.name}</div>
                        <div class="fav-card-rating">
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <span class="fav-card-rating-val">(5.0)</span>
                        </div>
                        
                        <div class="fav-card-pricing">
                            <div class="fav-price-row">
                                <span class="price-label">Giá thuê:</span>
                                <span class="price-value accent-trial">${formatCurrency(product.trial_price_per_day)} <span style="font-size: 10px; font-weight: normal; color: var(--text-secondary);">/ ngày</span></span>
                            </div>
                            <div class="fav-price-row">
                                <span class="price-label">Giá mua đứt:</span>
                                <span class="price-value">${formatCurrency(product.price)}</span>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="fav-card-actions">
                            <button class="btn-fav-action btn-fav-trial" onclick="addToCartDirect(${product.id}, 'trial', event)">
                                <i class="fa-solid fa-rotate"></i> Thuê thử
                            </button>
                            <button class="btn-fav-action btn-fav-buy" onclick="addToCartDirect(${product.id}, 'buy', event)">
                                <i class="fa-solid fa-cart-shopping"></i> Mua ngay
                            </button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        grid.innerHTML = '<p class="cart-loading">Không thể tải dữ liệu yêu thích. Vui lòng thử lại sau.</p>';
    }
}

window.removeFavorite = async function(productId, event) {
    if (event) event.stopPropagation();
    
    try {
        await apiFetch('/api/favorites/toggle', {
            method: 'POST',
            body: JSON.stringify({ productId })
        });
        loadFavoritesPage();
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
};

window.addToCartDirect = async function(productId, type, event) {
    if (event) event.stopPropagation();
    
    try {
        const productRes = await fetch(`/api/products/${productId}`);
        const productData = await productRes.json();
        
        if (productData.success && productData.product) {
            const variant = productData.product.variants[0];
            if (variant) {
                const addRes = await apiFetch('/api/cart/add', {
                    method: 'POST',
                    body: JSON.stringify({ variantId: variant.id, type, quantity: 1 })
                });
                
                if (addRes.success) {
                    loadCart(); // update header badge counter
                    alert(type === 'trial' ? 'Đã thêm đăng ký thuê thử vào giỏ hàng!' : 'Đã thêm sản phẩm mua đứt vào giỏ hàng!');
                } else {
                    alert('Lỗi: ' + addRes.message);
                }
            } else {
                alert('Sản phẩm không có phân loại khả dụng.');
            }
        } else {
            alert('Không thể lấy thông tin sản phẩm.');
        }
    } catch (e) {
        console.error('Error adding from favorites to cart:', e);
        alert('Có lỗi xảy ra khi thêm vào giỏ hàng.');
    }
};

// Global format currency helper if not defined
if (typeof formatCurrency !== 'function') {
    window.formatCurrency = function(value) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }
}
