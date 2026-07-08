/* ============================================================
   Minimal Product Card Web Component — Apple Inspired Design
   E-Tech Store — Dynamic & Sleek
   ============================================================ */

class ProductCard extends HTMLElement {
    static get observedAttributes() {
        return ['product-id', 'name', 'price', 'trial-price', 'image-url', 'manufacturer', 'stock-quantity', 'is-try', 'tags'];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const id = this.getAttribute('product-id') || '';
        const name = this.getAttribute('name') || 'Sản phẩm';
        const price = parseFloat(this.getAttribute('price') || '0');
        const trialPrice = parseFloat(this.getAttribute('trial-price') || '0');
        const imageUrl = this.getAttribute('image-url') || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500';
        const manufacturer = this.getAttribute('manufacturer') || 'E-Tech';
        const stockQuantity = parseInt(this.getAttribute('stock-quantity') || '0');
        const isTry = this.getAttribute('is-try') === '1';
        const tags = this.getAttribute('tags') || '';

        const isOutOfStock = stockQuantity <= 0;

        // Formatted Prices
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
        const formattedTrialPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trialPrice);

        // Apple dot colors mock based on manufacturer
        let colorDots = '';
        if (manufacturer.toLowerCase() === 'apple') {
            colorDots = `
                <span class="dot-color" style="background-color: #e3e4e5;" title="Bạc"></span>
                <span class="dot-color" style="background-color: #5b5b5c;" title="Xám Không Gian"></span>
                <span class="dot-color" style="background-color: #f5e4c9;" title="Vàng"></span>
                <span class="dot-color" style="background-color: #4f5359;" title="Xám Titan"></span>
            `;
        } else if (manufacturer.toLowerCase() === 'sony') {
            colorDots = `
                <span class="dot-color" style="background-color: #1a1a1a;" title="Đen"></span>
                <span class="dot-color" style="background-color: #ffffff; border: 1px solid #d2d2d7;" title="Trắng"></span>
            `;
        } else {
            colorDots = `
                <span class="dot-color" style="background-color: #1a1a1a;" title="Đen"></span>
                <span class="dot-color" style="background-color: #e3e4e5;" title="Bạc"></span>
            `;
        }

        // Subtitle text mock based on tags
        let subtitle = 'Thiết bị công nghệ cao cấp chính hãng.';
        if (tags.includes('van-phong')) {
            subtitle = 'Mỏng nhẹ. Sang trọng. Hiệu năng văn phòng vượt trội.';
        } else if (tags.includes('chup-anh') || tags.includes('chuyen-nghiep')) {
            subtitle = 'Camera chuyên nghiệp. Ghi lại trọn vẹn từng khoảnh khắc.';
        } else if (tags.includes('choi-game') || tags.includes('hieu-nang')) {
            subtitle = 'Cấu hình tối thượng. Xử lý tác vụ nặng mượt mà.';
        }

        this.innerHTML = `
            <article class="apple-product-card reveal visible" data-product-tags="${tags}" aria-label="${name}">
                <!-- Image Section -->
                <div class="apple-card-image-box" onclick="window.location.href='/product.html?id=${id}'">
                    <img src="${imageUrl}" alt="${name}" loading="lazy">
                </div>

                <!-- Color dots 
                <div class="apple-card-colors">
                    ${colorDots}
                </div>-->

                <!-- Content Info -->
                <div class="apple-card-info">
                    <span class="apple-card-badge-new"></span>
                    <br>
                    <h3 class="apple-card-title" onclick="window.location.href='/product.html?id=${id}'" title="${name}">
                        ${name}
                    </h3>
                    <p class="apple-card-subtitle">${subtitle}</p>

                    <!-- Pricing Info -->
                    <div class="apple-card-price-box">
                        <div class="apple-price-buy">Tiền đặt cọc: ${formattedPrice}</div>
                        ${isTry ? `<div class="apple-price-rent">Hoặc dùng thử chỉ từ <span>${formattedTrialPrice}</span>/ngày</div>` : ''}
                    </div>

                    <!-- Action buttons -->
                    <div class="apple-card-actions">
                        <button class="apple-btn-primary" onclick="window.location.href='/product.html?id=${id}'" ${isOutOfStock ? 'disabled' : ''}>
                            ${isOutOfStock ? 'Hết hàng' : 'Dùng thử'}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }
}

customElements.define('product-card', ProductCard);
