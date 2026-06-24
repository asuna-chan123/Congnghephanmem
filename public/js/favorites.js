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
                    if(!e.target.closest('.fav-card-heart')) {
                        window.location.href = `/product.html?id=${product.id}`;
                    }
                };

                card.innerHTML = `
                    <div class="fav-card-heart" onclick="removeFavorite(${product.id}, event)">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                    <img src="${product.image_url}" class="fav-card-image" alt="${product.name}">
                    <div class="fav-card-info">
                        <div class="fav-card-title">${product.name}</div>
                        <div class="fav-card-subtitle">E-Tech Store</div>
                        <div class="fav-card-price">${formatCurrency(product.price)}</div>
                        <div class="free-delivery-badge">Giao hàng miễn phí</div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        grid.innerHTML = '<p>Không thể tải dữ liệu yêu thích. Vui lòng thử lại sau.</p>';
    }
}

window.removeFavorite = async function(productId, event) {
    if(event) event.stopPropagation();
    
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
